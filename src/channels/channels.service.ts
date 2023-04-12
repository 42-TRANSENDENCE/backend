import {
  Injectable,
  Res,
  Inject,
  forwardRef,
  CACHE_MANAGER,
  UnauthorizedException,
  NotFoundException,
  MethodNotAllowedException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel, ChannelStatus } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember, MemberType } from 'src/channels/channelmember.entity';
import { ChannelsGateway } from './events.chats.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { returnStatusMessage } from './channel.interface';
import { Socket } from 'socket.io';
import { ChannelBanMember } from './channelbanmember.entity';

import { Cache } from 'cache-manager';
@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelBanMember)
    private channelBanMemberRepository: Repository<ChannelBanMember>,

    @Inject(forwardRef(() => ChannelsGateway))
    private readonly channelsGateway: ChannelsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private logger = new Logger(ChannelsService.name);

  async findById(id: number) {
    return this.channelsRepository.findOneBy({ id });
  }

  async getChannels() {
    const statuses = [ChannelStatus.PUBLIC, ChannelStatus.PROTECTED];
    return this.channelsRepository
      .createQueryBuilder('channel')
      .where('channel.status IN (:...statuses)', {
        statuses,
      }) // Add condition for status
      .getMany();
  }

  // 똑같은 title 이 중복 되는거 예외처리 
  async createChannels(title: string, password: string, myId: number) {
    // 이거 환경변수로 관리
    const saltRounds = 10;
    // 이거 constructor 로 entity안에 넣을까 ?
    const channel = this.channelsRepository.create({
      title: title,
      password,
      owner: myId,
      status: ChannelStatus.PUBLIC,
    });
    if (password) {
      const hashedPassword = await bcrypt.hash(password.toString(), saltRounds);
      channel.status = ChannelStatus.PROTECTED;
      channel.password = hashedPassword;
    }
    const channelReturned = await this.channelsRepository.save(channel);
    // this.logger.log(JSON.stringify(channelReturned))
    this.channelsGateway.EmitChannelInfo(channelReturned);
    const channelMember = this.channelMemberRepository.create({
      userId: myId,
      channelId: channelReturned.id,
      type: MemberType.OWNER,
    });
    await this.channelMemberRepository.save(channelMember);
  }

  // DM을 이미 만들었으면 똑같은 요청 오면 join만 하게.
  // async createDMChannel(user: User, reciveId: number) {
  //   const channel = this.channelsRepository.create({
  //     title: user.nickname,
  //     owner: user.id,
  //     status: ChannelStatus.PRIVATE,
  //   });
  //   const channelReturned = await this.channelsRepository.save(channel);
  //   const channelMember = this.channelMemberRepository.create({
  //     userId: myId,
  //     channelId: channelReturned.id,
  //     type: MemberType.OWNER,
  //   });
  //   const channelMember2 = this.channelMemberRepository.create({
  //     userId: reciveId,
  //     channelId: channelReturned.id,
  //     type: MemberType.MEMBER,
  //   });
  //   await this.channelMemberRepository.save(channelMember);
  //   await this.channelMemberRepository.save(channelMember2);
  //   return channelReturned;
  // }

  // 방이 없을때 예외 처리
  async getChannelInfo(channelId: number) {
    const channel = await this.findById(channelId);
    if (channel) {
      const channelMembers = await this.getChannelMembers(channelId);
      const user_ids = channelMembers.map((member) => member.userId);
      const result = { memberId: user_ids, status: channel.status };
      return result;
    } else throw new NotFoundException('Check the channelId if there is exist');
  }

  // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
  async getChannelMembers(channelId: number) {
    return this.channelMemberRepository.find({
      where: { channelId: channelId },
    });
  }

  // GET 내가 참여하고 있는 채팅방 목록
  // async getChannelsByUser(userId: number) {
  //   const channelMembers = await this.channelMemberRepository.find({
  //     where: { userId: userId },
  //   });
  //   const channelIds = channelMembers.map((member) => member.channelId);
  //   const channels = await this.channelsRepository.findByIds(channelIds);
  //   console.log(channels)
  //   return channels;
  // }

  async getChannelsByUser(userId: number) {
    try {
      const channelMembers = await this.channelMemberRepository.find({
        where: { userId: userId },
      });
      const channelIds = channelMembers.map((member) => member.channelId);
      if (channelIds.length === 0) {
        // If the user isn't a member of any channels, return an empty array
        return [];
      }
      const channels = await this.channelsRepository.findByIds(channelIds);
      return channels;
    } catch (error) {
      // Handle any errors that occur during the database queries
      this.logger.error('Error retrieving channels:', error);
      throw new Error('Unable to retrieve channels');
    }
  }

  async userEnterPrivateChannel(
    channelId: number,
    password: string,
    user: User,
    curChannel: Channel,
  ): Promise<returnStatusMessage> {
    // 맞으면 채팅방 멤버에추가 해줘야한다. -> channel member entitiy 에 insert 하는거 추가 해야함.
    if (password) {
      this.logger.log(`channel password : ${curChannel.password}`);
      const inputPasswordMatches = await bcrypt.compare(
        password,
        curChannel.password,
      );
      // this.logger.log(inputPasswordMatches);
      if (!inputPasswordMatches) {
        throw new UnauthorizedException('Invalid password');
      } else {
        // 맞으면 소켓 연결하고 디비에 추가 채널멤버에(채널멤버 엔티티에 insert 하는거 뭐 추가 해야함 배열에 ) .
        // this.logger.log(' debug : Check only Server suceccses');
        //db의 채널 멤버에 나 , user 추가
        //이미 채널id에 해당하는 멤버가 있으면 추가 ㄴㄴ!
        const isInUser = await this.channelMemberRepository
          .createQueryBuilder('channel_member')
          .where('channel_member.userId = :userId', { userId: user.id })
          .getOne();
        // console.log(isInUser)
        if (!isInUser) {
          const cm = this.channelMemberRepository.create({
            userId: user.id, // user.id
            channelId: channelId,
            type: MemberType.MEMBER,
          });
          this.channelMemberRepository.save(cm);
        }
        return { message: 'Enter Channel in successfully', status: 200 };
        // channel.owner = User.getbyid()~ 해서 나중에 merge 하고 연결 해주자
        // socket random 으로 만들어서
        // Q.위의 명령어가 Controller 에서만 돼서 Promise 로 받아서 Controller로 전달해서 해결
        // 근데 왜 그렇지 ??? 어차피 똑같은 얘를 인자로 계속 가져와서 쓰는데
      }
    } else {
      // 비번방인데 비밀번호 입력 안 했을때
      throw new UnauthorizedException('Invalid password');
    }
  }
  async userEnterPublicChannel(
    channelId: number,
    user: User,
    curChannel: Channel,
  ): Promise<returnStatusMessage> {
    // 공개방은 무조건 소켓 연결 근데 + 밴 리스트 !! 는 나중에
    const isInUser = await this.channelMemberRepository
      .createQueryBuilder('channel_member')
      .where('channel_member.userId = :userId', { userId: user.id }) // 1 -> user.id
      .getOne();
    // console.log(isInUser)
    if (!isInUser) {
      const cm = this.channelMemberRepository.create({
        userId: user.id, // user.id
        channelId: channelId,
        type: MemberType.MEMBER,
      });
      this.channelMemberRepository.save(cm);
    }
    // this.channelsGateway.nsp.emit('join-channel', channelId);
    return { message: 'Enter Channel in successfully', status: 200 };
  }

  async userEnterChannel(
    channelId: number,
    password: string,
    user: User,
  ): Promise<returnStatusMessage> {
    const curChannel = await this.channelsRepository.findOneBy({
      id: channelId,
    });
    this.logger.log(user);
    this.logger.log(await this.isBanned(channelId, user.id)); // user.id 와 연결해야함
    if (await this.isBanned(channelId, user.id))
      throw new UnauthorizedException('YOU ARE BANNED');
    if (!curChannel) throw new NotFoundException('Plz Enter Exist Room');
    // this.logger.debug(curChannel.status === ChatStatus.PROTECTED)
    if (curChannel.status === ChannelStatus.PROTECTED)
      return this.userEnterPrivateChannel(
        channelId,
        password,
        user,
        curChannel,
      );
    return this.userEnterPublicChannel(channelId, user, curChannel);
  }

  async isAdmininChannel(channelId: number, userId: number) {
    const curChannelMember = await this.channelMemberRepository.findOneBy({
      channelId: channelId,
      userId: userId,
    });
    if (curChannelMember.type === 'ADMIN') return true;
    return false;
  }
  // 내가 이 채팅방에 owner 권한이 있는지
  // 없으면  cut 있으면  admin 권한을  toUserid 에게 준다.
  async ownerGiveAdmin(channelId: number, toUserId: number, user: User) {
    const isInUser = await this.channelMemberRepository
      .createQueryBuilder('channel_member')
      .where('channel_member.UserId = :userId', { userId: toUserId })
      .getOne();
    if (!isInUser)
      throw new NotFoundException(`In this room ${toUserId} is not exsit`);
    if (isInUser.type === 'MEMBER')
      throw new MethodNotAllowedException('You have no permission');
    const curChannel = await this.findById(channelId);
    if (!curChannel) throw new NotFoundException(`${channelId} is not exsit`);
    if (curChannel.owner == toUserId)
      throw new MethodNotAllowedException('Owner could not downgrade admin');
    // owner 가 admin을 자기 자신한테 주면 그냥 owner되게 하기
    // 해당 채널의 멤버가 admin인지 확인하는것도 추가 해야함
    if (
      user.id === curChannel.owner ||
      this.isAdmininChannel(channelId, user.id)
    ) {
      // curChannel.admin = toUserId;
      const member = curChannel.members.find(
        (member) => member.userId === toUserId,
      );
      if (!member)
        throw new NotFoundException(`In this room ${toUserId} is not exsit`);
      if (member.type === MemberType.ADMIN)
        throw new MethodNotAllowedException('Already Admin');
      {
        member.type = MemberType.ADMIN; // Update the member's type to ADMIN
        await this.channelMemberRepository.save(member); // Save the updated Channel entity to the database
      }
    }
  }

  // 소켓으로 'leave-room' event 가 오면 게이트웨이 에서 아래 함수가 호출하게끔 해야 하나??
  async userExitChannel(socket: Socket, roomId: string, userId: number) {
    // 이러면 내가 무슨 user 인지 알수 있나 .. ?
    // roomId  가 채널의 id 이겠지 ?
    // 채팅방 오너가 나가면 채팅방 삭제.
    try {
      const curChannel = await this.findById(+roomId);
      // 근데 만약 그 채널에 없는 사람이 leave-room 이벤트 보내는 경우도 생각.
      this.logger.log(`curChannel : ${curChannel}`);
      if (!curChannel) {
        throw new NotFoundException('The channel does not exist');
      }

      if (curChannel.owner === userId) {
        // 멤버 먼저 삭제 하고  방자체를 삭제 ? 아님 그냥 방삭제
        this.channelMemberRepository.delete({ channelId: +roomId });
        this.channelsRepository.delete({ id: +roomId });
      } else {
        // 멤버에서만 delete
        //TODO:채널 안의 멤버 가 존재 하는지 안 하는지 쿼리
        // const curChannelMembers = this.channelMemberRepository.findOne({ChannelId: })
        const curChannelMembers = await this.channelMemberRepository
          .createQueryBuilder('channel_member')
          .where('channel_member.UserId = :userId', { userId: userId }) // 1 -> user.id
          .getOne();
        // const curChannelMembers = await this.findById(+roomId)
        if (!curChannelMembers)
          throw new NotFoundException('Member in this Channel does not exist!');
        else
          this.channelMemberRepository.delete({
            userId: userId,
            channelId: +roomId,
          });
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        // handle the case where the channel does not exist
        this.logger.log(error.message);
      } else {
        // handle other errors
        this.logger.log('userExitChannel: Unexpected error:', error);
      }
    }
  }

  // TODO: 권한 설정해서 Owner, admin이 이거 요청할시에 컷 해야함 if 문말고 깔끔하게 !
  // Ban Post요청
  async postBanInChannel(channelId: number, userId: number, user: User) {
    const isInUser = await this.channelBanMemberRepository
      .createQueryBuilder('channel_ban_member')
      .where('channel_ban_member.UserId = :userId', { userId: userId }) // 1 -> user.id
      .getOne();
    this.logger.log(`in this room banned in user : ${isInUser}`);
    if (!isInUser) {
      const cm = this.channelBanMemberRepository.create({
        userId: userId, // user.id
        channelId: channelId,
        expiresAt: new Date('9999-12-31T23:59:59.999Z'),
      });
      this.channelBanMemberRepository.save(cm);
    }
    // kick event emit  해 줘야 한다 . 그전에 방에서 제거 해야겠지? 근데 내가 kick event emit하면
    // 프론트에서 leave-room 이벤트 나한테 주면 되긴함.
  }

  // Kick Post 요청 : 일단 얘는 10 초 kick  이다 . Banlist에 10 초로 넣어 놓자
  async postKickInChannel(channelId: number, userId: number, user: User) {
    const isInUser = await this.channelBanMemberRepository
      .createQueryBuilder('channel_ban_member')
      .where('channel_ban_member.UserId = :userId', { userId: userId })
      .getOne();
    this.logger.log(`in this room kicked in user : ${isInUser}`);
    if (!isInUser) {
      const cm = this.channelBanMemberRepository.create({
        userId: userId, // user.id
        channelId: channelId,
        expiresAt: new Date(Date.now() + 10 * 1000),
      });
      this.channelBanMemberRepository.save(cm);
    }
    // kick event emit  해 줘야 한다 . 그전에 방에서 제거 해야겠지? 근데 내가 kick event emit하면
    // 프론트에서 leave-room 이벤트 나한테 주면 되긴함.
  }

  async isBanned(channelId: number, userId: number): Promise<boolean> {
    const ban = await this.channelBanMemberRepository.findOne({
      where: { channelId: channelId, userId: userId },
    });
    if (ban) {
      this.logger.log(
        `check time : ${Number(ban.expiresAt) - Number(new Date(Date.now()))}`,
      );
      if (Number(ban.expiresAt) - Number(new Date(Date.now())) > 0) return true;
      else {
        this.channelBanMemberRepository.delete({
          userId: userId,
          channelId: channelId,
        });
        return false;
      }
    } else return false;
  }

  async addToKicklist(
    roomId: number,
    userId: number,
    ttl: number,
  ): Promise<void> {
    const key = `chatroom:${roomId}:kicklist`;
    const kicklist = (await this.cacheManager.get<number[]>(key)) || [];
    if (!kicklist.includes(userId)) {
      kicklist.push(userId);
      await this.cacheManager.set(key, kicklist, 50000);
    }
    this.logger.log(`check kicklist : ${kicklist}`);
  }

  async addToMutelist(
    roomId: number,
    userId: number,
    ttl: number,
  ): Promise<void> {
    const key = `chatroom:${roomId}:mutelist`;
    const mutelist = (await this.cacheManager.get<number[]>(key)) || [];

    if (!mutelist.includes(userId)) {
      mutelist.push(userId);
      await this.cacheManager.set(key, mutelist, 50000);
    }
    this.logger.log(`check mutelist : ${mutelist}`);
  }

  async getMutelist(roomId: number): Promise<number[]> {
    const key = `chatroom:${roomId}:mutelist`;
    const mutelist = (await this.cacheManager.get<number[]>(key)) || [];
    return mutelist;
  }
}
