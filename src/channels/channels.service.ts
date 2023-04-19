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
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Channel, ChannelStatus } from './entity/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember, MemberType } from './entity/channelmember.entity';
import { ChannelsGateway } from './events.chats.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { returnStatusMessage } from './channel.interface';
import { Socket } from 'socket.io';
import { ChannelBanMember } from './entity/channelbanmember.entity';
// import { ChannelMemberDto } from './dto/channel-member.dto';

import { Cache } from 'cache-manager';
import { ChannelMemberDto } from './dto/channel-member.dto';
import { ChannelIfoDto } from './dto/channel-info.dto';
import { CreateDmDto } from './dto/create-dm.dto';
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

  async findByIdWithOwner(id: number) {
    return this.channelsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }
  async findByIdwithOwnerMember(id: number) {
    return await this.channelsRepository.findOne({
      where: { id },
      relations: {
        members: true,
        owner: true,
      },
    });
  }
  async findById(id: number) {
    return this.channelsRepository.findOneBy({ id });
  }

  async getChannels() {
    const statuses = [ChannelStatus.PUBLIC, ChannelStatus.PROTECTED];
    const channels = await this.channelsRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.owner', 'owner')
      .where('channel.status IN (:...statuses)', {
        statuses,
      })
      .getMany();
    //여기엔 유저 닉네임만 넣어주면 됨 .
    // const user
    const channelDtos = channels.map((channel) => new ChannelIfoDto(channel));
    return channelDtos;
  }
  // 채팅방 하나에 대한 정보 요청 .
  // 멤버 안에 아바타 ,
  async getChannelInfo(channelId: number, user: User) {
    const channel = await this.findById(channelId);
    if (channel) {
      const channelMembers = await this.getChannelMembersDto(channelId);
      // 이놈도 DTO로 ?
      const whoami = await this.channelMemberRepository.findOne({
        where: { channelId: channelId, userId: user.id },
      });
      // 밴된 멤버가 안에 있을경우 에러남.
      this.logger.log(JSON.stringify(whoami));
      if (!whoami)
        throw new NotFoundException('CHECK MemberId ID IF IT IS EXIST');
      const result = {
        channelStatus: channel.status,
        channelMembers,
        myType: whoami.type || null,
      };
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
      // const channels = await this.channelsRepository.find({
      //   where: { id: In(channelIds) ,relations:['owner']}, // Use In operator here
      // });
      const channels = await this.channelsRepository
        .createQueryBuilder('channel')
        .where('channel.id IN (:...channelIds)', { channelIds })
        .leftJoinAndSelect('channel.owner', 'owner') // Specify the relationship name ('owner' in this case)
        .getMany();
      const channelDtos = channels.map((channel) => new ChannelIfoDto(channel));
      return channelDtos;
    } catch (error) {
      // Handle any errors that occur during the database queries
      this.logger.error('Error retrieving channels:', error);
      throw new Error('Unable to retrieve channels');
    }
  }

  // 똑같은 title 이 중복 되는거 예외처리
  async createChannel(title: string, password: string, user: User) {
    // 이거 환경변수로 관리
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
      owner: user,
      status: ChannelStatus.PUBLIC,
    });
    if (password) {
      const hashedPassword = await this.generatePassword(password);
      channel.status = ChannelStatus.PROTECTED;
      channel.password = hashedPassword;
    }
    const channelReturned = await this.channelsRepository.save(channel);
    // this.logger.log(JSON.stringify(channelReturned))
    this.channelsGateway.EmitChannelInfo(channelReturned);
    const channelMember = this.channelMemberRepository.create({
      userId: user.id,
      channelId: channelReturned.id,
      type: MemberType.OWNER,
    });
    await this.channelMemberRepository.save(channelMember);
  }

  // DM을 이미 만들었으면 똑같은 요청 오면 join만 하게.
  // TODO: A가 B에게 DM 보내면 방 1 생성, B가 A에게 DM 보내면 방 2 생성 되면 안됨!
  // 한채팅방에 2명이 있는지 확인 해야함.
  // 그리고 두명 이상 못들어가게 막아야함.
  // 나가는경우 어떻게 처리 할지 생각
  async createDMChannel(user: User, reciver: CreateDmDto) {
    const channel = this.channelsRepository.create({
      title: user.nickname + reciver.nickname + 'DM',
      owner: user,
      status: ChannelStatus.PRIVATE,
    });
    const channelReturned = await this.channelsRepository.save(channel);
    const channelMember = this.channelMemberRepository.create({
      userId: user.id,
      channelId: channelReturned.id,
      type: MemberType.MEMBER,
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
      throw new NotAcceptableException('YOU ARE BANNED');
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

  async isOwnerinChannel(channelId: number, userId: number) {
    const curChannelMember = await this.channelMemberRepository.findOneBy({
      channelId: channelId,
      userId: userId,
    });
    if (curChannelMember.type === 'OWNER') return true;
    return false;
  }

  // 내가 이 채팅방에 owner 권한이 있는지
  // 없으면  cut 있으면  admin 권한을  toUserid 에게 준다.
  async ownerGiveAdmin(channelId: number, toUserId: number, user: User) {
    // const isInUser = await this.channelMemberRepository
    //   .createQueryBuilder('channel_member')
    //   .where('channel_member.userId = :userId', { userId: toUserId })
    //   .getOne();
    const you = await this.channelMemberRepository.findOneBy({
      channelId: channelId,
      userId: toUserId,
    });
    if (!you) throw new NotFoundException('TOUSER IS NOT IN THIS CHANNEL');
    const me = await this.channelMemberRepository.findOneBy({
      channelId: channelId,
      userId: user.id,
    });
    if (!me) throw new NotFoundException('ME IS NOT IN THIS CHANNEL');
    // if (!isInUser)
    //   throw new NotFoundException(`In this room ${toUserId} is not exsit`);
    if (me.type !== MemberType.OWNER)
      throw new MethodNotAllowedException('YOU HAVE NO PERMISSION');
    // const curChannel = await this.findByIdWithOwner(channelId);
    const curChannel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: {
        members: true,
        owner: true,
      },
    });
    if (!curChannel) throw new NotFoundException(`${channelId} IS NOT EXIST`);
    if (
      user.id === curChannel.owner.id ||
      this.isAdmininChannel(channelId, user.id)
    ) {
      const member = curChannel.members.find(
        (member) => member.userId == toUserId,
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
      // const curChannel = await this.findByIdWithOwner(+channelId);
      const curChannel = await this.findByIdwithOwnerMember(+channelId);
      this.logger.log(`;;:${JSON.stringify(curChannel.members.length)}`);
      // 근데 만약 그 채널에 없는 사람이 leave-room 이벤트 보내는 경우도 생각.
      // this.logger.log(`curChannel : ${JSON.stringify(curChannel)}`);
      if (!curChannel) {
        throw new NotFoundException('CHANNEL DOSE NOT EXIST');
      }
      this.logger.log(
        `curChannel.owner.id : ${curChannel.owner.id}, userId : ${userId}`,
      );
      if (
        +curChannel.owner.id === +userId ||
        +curChannel.members.length === 1
      ) {
        // 멤버 먼저 삭제 하고  방자체를 삭제 ? 아님 그냥 방삭제
        await this.channelMemberRepository.delete({ channelId: +channelId });
        this.channelsGateway.EmitDeletChannelInfo(curChannel);
        await this.channelsRepository.delete({ id: +channelId });
      } else {
        // 멤버에서만 delete
        //TODO:채널 안의 멤버 가 존재 하는지 안 하는지 쿼리
        const curChannelMembers = await this.channelMemberRepository
          .createQueryBuilder('channel_member')
          .where('channel_member.userId = :userId', { userId: userId }) // 1 -> user.id
          .getOne();
        // const curChannelMembers = await this.findById(+channelId)
        if (!curChannelMembers)
          throw new NotFoundException('Member in this Channel does not exist!');
        else {
          await this.channelMemberRepository.delete({
            userId: userId,
            channelId: +channelId,
          });
          this.channelsGateway.emitOutMember(userId, +channelId);
        }
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
    // 내가 owner 인지 확인! 아니면 admin 인지 확인
    this.logger.log(await this.isOwnerinChannel(channelId, user.id));
    if (!this.isOwnerinChannel(channelId, user.id))
      throw new MethodNotAllowedException('YOU HAVE NO PERMISSION');
    // const isInUser = await this.channelBanMemberRepository
    //   .createQueryBuilder('channel_ban_member')
    //   .where('channel_ban_member.userId = :userId', {
    //     userId: userId,
    //     channelId: channelId,
    //   }) // 1 -> user.id
    //   // .leftJoinAndSelect('channel_ban_member.user', 'user')
    //   .getOne();
    // 내가 owner 인지 확인! 아니면 admin 인지 확인
    const isInUser = await this.channelBanMemberRepository.findOne({
      where: { userId: userId, channelId: channelId },
    });
    this.logger.log(
      `in this room banned in user : ${JSON.stringify(isInUser)}`,
    );
    if (isInUser) throw new MethodNotAllowedException('ALREADY BANNED');
    if (!isInUser) {
      // this.channelsGateway.emitOutMember(userId, channelId);
      const cm = await this.channelBanMemberRepository.create({
        userId: userId, // user.id
        channelId: channelId,
        expiresAt: new Date('9999-12-31T23:59:59.999Z'),
      });
      // this.logger.log(JSON.stringify(cm));
      this.channelBanMemberRepository.save(cm);
    }
    // kick event emit  해 줘야 한다 . 그전에 방에서 제거 해야겠지? 근데 내가 kick event emit하면
    // 프론트에서 leave-room 이벤트 나한테 주면 되긴함.
  }

  // Kick Post 요청 : 일단 얘는 10 초 kick  이다 . Banlist에 10 초로 넣어 놓자
  async postKickInChannel(channelId: number, userId: number, user: User) {
    const isInUser = await this.channelBanMemberRepository
      .createQueryBuilder('channel_ban_member')
      .where('channel_ban_member.userId = :userId', { userId: userId })
      .getOne();
    this.logger.log(`in this room kicked in user : ${isInUser}`);
    if (isInUser) throw new MethodNotAllowedException('ALREADY BANNED');
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
    this.channelsGateway.emitMuteMember(userId, channelId);
  }

  async getMutelist(channelId: number): Promise<number[]> {
    const key = `chatroom:${channelId}:mutelist`;
    const mutelist = (await this.cacheManager.get<number[]>(key)) || [];
    return mutelist;
  }

  async generatePassword(password: string) {
    //환경변수로 바꾸자.
    const saltRounds = 10;
    if (password) {
      const hashedPassword = await bcrypt.hash(password.toString(), saltRounds);
      return hashedPassword;
    }
  }
  async patchChannelPassword(channelId: number, user: User, password: string) {
    const curChannel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['owner'],
    });
    if (+curChannel.owner.id !== +user.id) {
      throw new UnauthorizedException('You are not owner of this channel');
    }
    if (!curChannel) {
      throw new NotFoundException('CHANNEL DOSE NOT EXIST');
    }
    if (!password) {
      curChannel.password = '';
      curChannel.status = ChannelStatus.PUBLIC;
      await this.channelsRepository.save(curChannel);
    } else {
      const hashedPassword = await this.generatePassword(password);
      curChannel.password = hashedPassword;
      curChannel.status = ChannelStatus.PROTECTED;
      await this.channelsRepository.save(curChannel);
    }
  }
}
