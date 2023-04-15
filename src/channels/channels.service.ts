import {
  Injectable,
  Inject,
  forwardRef,
  CACHE_MANAGER,
  UnauthorizedException,
  NotFoundException,
  MethodNotAllowedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Channel, ChannelStatus } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember, MemberType } from 'src/channels/channelmember.entity';
import { ChannelsGateway } from './events.chats.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { returnStatusMessage } from './channel.interface';
import { Socket } from 'socket.io';
import { ChannelBanMember } from './channelbanmember.entity';
// import { ChannelMemberDto } from './dto/channel-member.dto';

import { Cache } from 'cache-manager';
import { ChannelMemberDto } from './dto/channel-member.dto';
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
    const channels = await this.channelsRepository
      .createQueryBuilder('channel')
      .where('channel.status IN (:...statuses)', {
        statuses,
      })
      .getMany();
    //여기엔 유저 닉네임만 넣어주면 됨 .
    return channels;
  }
  // 채팅방 하나에 대한 정보 요청 .
  // 멤버 안에 아바타 ,
  async getChannelInfo(channelId: number) {
    const channel = await this.findById(channelId);
    if (channel) {
      const channelMembers = await this.getChannelMembers(channelId);
      const user_ids = channelMembers.map((member) => member.userId);
      const result = { memberId: user_ids, status: channel.status };
      return result;
    } else throw new NotFoundException('CHECK CHANNEL ID IF IT IS EXIST');
  }

  // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
  async getChannelMembers(channelId: number) {
    const members = await this.channelMemberRepository.find({
      where: { channelId: channelId },
    });
    if (members.length === 0)
      throw new NotFoundException('CHECK CHANNEL ID IF IT IS EXIST');
    // return members;
    return members;
  }
  // getChannelMembersDto
  async getChannelMembersDto(channelId: number): Promise<ChannelMemberDto[]> {
    const members = await this.channelMemberRepository.find({
      where: { channelId: channelId },
      relations: { user: true },
    });
    // this.logger.log(JSON.stringify(members[0].user));
    const memberDtos = members.map((member) => new ChannelMemberDto(member));
    return memberDtos;
  }

  // 나의 채팅목록
  async getMyChannels(user: User) {
    try {
      const channelMembers = await this.channelMemberRepository.find({
        where: { userId: user.id },
      });
      const channelIds = channelMembers.map((member) => member.channelId);
      if (channelIds.length === 0) {
        // If the user isn't a member of any channels, return an empty array
        return [];
      }
      const channels = await this.channelsRepository.find({
        where: { id: In(channelIds) }, // Use In operator here
      });
      return channels;
    } catch (error) {
      // Handle any errors that occur during the database queries
      this.logger.error('Error retrieving channels:', error);
      throw new Error('Unable to retrieve channels');
    }
  }

  // 똑같은 title 이 중복 되는거 예외처리
  async createChannels(title: string, password: string, myId: number) {
    // 이거 환경변수로 관리
    const saltRounds = 10;
    const isDuplicate = await this.channelsRepository.findOneBy({
      title,
    });
    if (isDuplicate) {
      throw new BadRequestException('CHANNEL TITLE ALREADY EXIST');
    }
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
    // return channelReturned; // 이게 맞나?
  }

  // DM을 이미 만들었으면 똑같은 요청 오면 join만 하게.
  async createDMChannel(user: User, reciver: User) {
    const channel = this.channelsRepository.create({
      title: user.nickname + reciver.nickname + 'DM',
      owner: user.id,
      status: ChannelStatus.PRIVATE,
    });
    const channelReturned = await this.channelsRepository.save(channel);
    const channelMember = this.channelMemberRepository.create({
      userId: user.id,
      channelId: channelReturned.id,
      type: MemberType.OWNER,
    });
    const channelMember2 = this.channelMemberRepository.create({
      userId: reciver.id,
      channelId: channelReturned.id,
      type: MemberType.MEMBER,
    });
    await this.channelMemberRepository.save(channelMember);
    await this.channelMemberRepository.save(channelMember2);
    return channelReturned;
  }

  async userEnterPrivateChannel(
    channelId: number,
    password: string,
    user: User,
    curChannel: Channel,
  ): Promise<returnStatusMessage> {
    if (password) {
      // this.logger.log(`channel password : ${curChannel.password}`);
      const inputPasswordMatches = await bcrypt.compare(
        password,
        curChannel.password,
      );
      // this.logger.log(inputPasswordMatches);
      if (!inputPasswordMatches) {
        throw new ForbiddenException('INVALID PASSWORD');
      } else {
        const isInUser = await this.channelMemberRepository.findOne({
          where: { channelId: channelId, userId: user.id },
        });
        if (isInUser) throw new BadRequestException('Already in the channel');
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
      }
    } else {
      // 비번방인데 비밀번호 입력 안 했을때
      throw new ForbiddenException('INVALID PASSWORD');
    }
  }
  async userEnterPublicChannel(
    channelId: number,
    user: User,
  ): Promise<returnStatusMessage> {
    const isInUser = await this.channelMemberRepository.findOne({
      where: { channelId: channelId, userId: user.id },
    });
    if (isInUser) throw new BadRequestException('Already in the channel');
    if (!isInUser) {
      const cm = this.channelMemberRepository.create({
        userId: user.id,
        channelId: channelId,
        type: MemberType.MEMBER,
      });
      this.channelMemberRepository.save(cm);
    }
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
    // this.logger.log(await this.isBanned(channelId, user.id));
    if (await this.isBanned(channelId, user.id))
      throw new UnauthorizedException('YOU ARE BANNED');
    if (!curChannel) throw new NotFoundException('PLZ ENTER EXIST CHANNEL');
    if (curChannel.status === ChannelStatus.PROTECTED)
      return this.userEnterPrivateChannel(
        channelId,
        password,
        user,
        curChannel,
      );
    return this.userEnterPublicChannel(channelId, user);
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
      throw new MethodNotAllowedException('YOU HAVE NO PERMISSION');
    const curChannel = await this.findById(channelId);
    if (!curChannel) throw new NotFoundException(`${channelId} IS NOT EXIST`);
    if (curChannel.owner == toUserId)
      throw new MethodNotAllowedException('OWNER CAN NOT BE ADMIN');
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
        throw new NotFoundException(`IN THIS CHANNEL ${toUserId} IS NOT EXIST`);
      if (member.type === MemberType.ADMIN)
        throw new MethodNotAllowedException('ALREADY ADMIN');
      {
        member.type = MemberType.ADMIN; // Update the member's type to ADMIN
        await this.channelMemberRepository.save(member); // Save the updated Channel entity to the database
      }
    }
  }

  // 소켓으로 'leave-room' event 가 오면 게이트웨이 에서 아래 함수가 호출하게끔 해야 하나??
  async userExitChannel(socket: Socket, channelId: string, userId: number) {
    // 이러면 내가 무슨 user 인지 알수 있나 .. ?
    // channelId  가 채널의 id 이겠지 ?
    // 채팅방 오너가 나가면 채팅방 삭제.
    try {
      const curChannel = await this.findById(+channelId);
      // 근데 만약 그 채널에 없는 사람이 leave-room 이벤트 보내는 경우도 생각.
      // this.logger.log(`curChannel : ${JSON.stringify(curChannel)}`);
      if (!curChannel) {
        throw new NotFoundException('CHANNEL DOSE NOT EXIST');
      }
      if (+curChannel.owner === +userId) {
        // 멤버 먼저 삭제 하고  방자체를 삭제 ? 아님 그냥 방삭제
        await this.channelMemberRepository.delete({ channelId: +channelId });
        this.channelsGateway.EmitDeletChannelInfo(curChannel);
        await this.channelsRepository.delete({ id: +channelId });
      } else {
        // 멤버에서만 delete
        //TODO:채널 안의 멤버 가 존재 하는지 안 하는지 쿼리
        // const curChannelMembers = this.channelMemberRepository.findOne({ChannelId: })
        const curChannelMembers = await this.channelMemberRepository
          .createQueryBuilder('channel_member')
          .where('channel_member.userId = :userId', { userId: userId }) // 1 -> user.id
          .getOne();
        // const curChannelMembers = await this.findById(+channelId)
        if (!curChannelMembers)
          throw new NotFoundException('Member in this Channel does not exist!');
        else
          await this.channelMemberRepository.delete({
            userId: userId,
            channelId: +channelId,
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
        await this.channelBanMemberRepository.delete({
          userId: userId,
          channelId: channelId,
        });
        return false;
      }
    } else return false;
  }

  async addToKicklist(
    channelId: number,
    userId: number,
    ttl: number,
  ): Promise<void> {
    const key = `chatroom:${channelId}:kicklist`;
    const kicklist = (await this.cacheManager.get<number[]>(key)) || [];
    if (!kicklist.includes(userId)) {
      kicklist.push(userId);
      await this.cacheManager.set(key, kicklist, 50000);
    }
    this.logger.log(`check kicklist : ${kicklist}`);
  }

  async addToMutelist(
    channelId: number,
    userId: number,
    ttl: number,
  ): Promise<void> {
    const key = `chatroom:${channelId}:mutelist`;
    const mutelist = (await this.cacheManager.get<number[]>(key)) || [];

    if (!mutelist.includes(userId)) {
      mutelist.push(userId);
      await this.cacheManager.set(key, mutelist, 50000); // 임시
    }
    this.logger.log(`check mutelist : ${mutelist}`);
  }

  async getMutelist(channelId: number): Promise<number[]> {
    const key = `chatroom:${channelId}:mutelist`;
    const mutelist = (await this.cacheManager.get<number[]>(key)) || [];
    return mutelist;
  }
}
