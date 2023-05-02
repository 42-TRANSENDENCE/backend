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
import { Channel, ChannelStatus } from './entity/channels.entity';
import { User } from 'src/users/users.entity';
import { MemberType } from './entity/channelmember.entity';
import { ChannelsGateway, HowMany } from './events.chats.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { returnStatusMessage } from './channel.interface';
import { Socket } from 'socket.io';

import { Cache } from 'cache-manager';
import { ChannelMemberDto } from './dto/channel-member.dto';
import { ChannelIfoDto } from './dto/channel-info.dto';
import { CreateDmDto } from './dto/create-dm.dto';

import { parse } from 'cookie';
import { AuthService } from 'src/auth/auth.service';
import { FriendsService } from 'src/users/friends/friends.service';
import { ChannelTotalIfoDto } from './dto/chanel-total-info.dto';
import { UsersService } from 'src/users/users.service';
import { ChannelRepository } from './repository/channel.repository';
import { MemberRepository } from './repository/member.repository';
import { BanMemberRepository } from './repository/banmember.repository';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly channelsRepository: ChannelRepository,
    private readonly channelMemberRepository: MemberRepository,
    private readonly channelBanMemberRepository: BanMemberRepository,

    @Inject(forwardRef(() => FriendsService))
    private readonly friendsService: FriendsService,

    @Inject(forwardRef(() => ChannelsGateway))
    private readonly channelsGateway: ChannelsGateway,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}
  private logger = new Logger(ChannelsService.name);

  async findOneChannelMember(channelId: number, userId: number) {
    return this.channelMemberRepository.findOneChannelIdUserId(
      channelId,
      userId,
    );
  }

  async getChannels() {
    const channels =
      await this.channelsRepository.findPublicAndProtectedChannels();
    const channelDtos = channels.map((channel) => new ChannelIfoDto(channel));
    return channelDtos;
  }

  // 채팅방 하나에 대한 정보 요청 .
  // 멤버 안에 아바타 ,
  async getChannelInfo(channelId: number, user: User) {
    const channel = await this.channelsRepository.findById(channelId);
    if (channel) {
      const channelMembers = await this.getChannelMembersDto(channelId);
      const whoami = await this.channelMemberRepository.findOneChannelIdUserId(
        channelId,
        user.id,
      );
      // 밴된 멤버가 안에 있을경우 에러남.
      if (!whoami)
        throw new NotFoundException('CHECK MemberId ID IF IT IS EXIST');
      const howmany: HowMany = {
        joinSockets: this.channelsGateway.getClientsInRoom(
          channelId.toString(),
        ),
        joinMembers: (await this.getChannelMembers(channelId)).length,
      };
      const total = await this.getOneChannelTotalInfoDto(
        channel,
        channelMembers,
        howmany,
        whoami.type || null,
      );
      return total;
    } else throw new NotFoundException('CHECK CHANNEL ID IF IT IS EXIST');
  }

  async getBlockedArray(user: User): Promise<number[]> {
    const blockships = await this.friendsService.getAllDoBlocks(user);
    const blockedArray = blockships.map((blockship) => blockship.id);
    this.logger.log(`TEST : ${user.id} this is blockedArray : ${blockedArray}`);
    return blockedArray;
  }
  async getOneChannelTotalInfoDto(
    channel: Channel,
    channelMembers: ChannelMemberDto[],
    howmany: HowMany,
    myType?: MemberType,
  ) {
    return new ChannelTotalIfoDto(channel, channelMembers, howmany, myType);
  }

  // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
  async getChannelMembers(channelId: number) {
    const members = await this.channelMemberRepository.findMemberByChannelId(
      channelId,
    );
    if (members.length === 0)
      throw new NotFoundException('CHECK CHANNEL ID IF IT IS EXIST');
    return members;
  }

  // getChannelMembersDto
  async getChannelMembersDto(channelId: number): Promise<ChannelMemberDto[]> {
    const members =
      await this.channelMemberRepository.findMemberByChannelIdWithUser(
        channelId,
      );
    const memberDtos = members.map((member) => new ChannelMemberDto(member));
    return memberDtos;
  }

  // 나의 채팅목록
  async getMyChannels(user: User) {
    try {
      const channelMembers =
        await this.channelMemberRepository.findMemberByUserId(user.id);
      const channelIds = channelMembers.map((member) => member.channelId);
      if (channelIds.length === 0) {
        // If the user isn't a member of any channels, return an empty array
        return [];
      }
      const channels = await this.channelsRepository.findMyChannels(channelIds);
      const channelDtos = channels.map((channel) => {
        if (channel.owner) {
          // Add null check before accessing 'nickname' property
          return new ChannelIfoDto(channel);
        }
      });
      return channelDtos.filter(Boolean); // Filter out any null or undefined values
    } catch (error) {
      // Handle any errors that occur during the database queries
      this.logger.error('Error retrieving channels:', error);
      throw new Error('Unable to retrieve channels');
    }
  }

  async createChannel(title: string, password: string, user: User) {
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
    this.channelsGateway.EmitChannelInfo(channelReturned);
    const channelMember = this.channelMemberRepository.create({
      userId: user.id,
      channelId: channelReturned.id,
      type: MemberType.OWNER,
    });
    await this.channelMemberRepository.save(channelMember);
  }

  // DM을 이미 만들었으면 똑같은 요청 오면 join만 하게.
  async createDMChannel(user: User, receiver: CreateDmDto) {
    this.logger.log(
      `this is isBlocked : ${await this.friendsService.isBlocked(
        user.id,
        receiver.id,
      )}`,
    );
    if (await this.friendsService.isBlocked(user.id, receiver.id))
      throw new NotAcceptableException('YOU ARE BLOCK THIS USER');
    const sortedNicknames = [user.nickname, receiver.nickname].sort();
    const title = sortedNicknames[0] + sortedNicknames[1];
    const isDuplicate = await this.channelsRepository.findOnebyTitle(title);
    if (isDuplicate) {
      // 멤버 없으면 넣고 있으면 넣지말고
      const isMember =
        await this.channelMemberRepository.findOneChannelIdUserId(
          isDuplicate.id,
          user.id,
        );
      if (!isMember) {
        const channelMember = this.channelMemberRepository.create({
          userId: user.id,
          channelId: isDuplicate.id,
          type: MemberType.MEMBER,
        });
        this.channelsGateway.emitInMember(user.id, isDuplicate.id);
        await this.channelMemberRepository.save(channelMember);
      }
      throw new BadRequestException({
        message: 'YOU ARE AREADY IN DM',
        channelId: isDuplicate.id,
      });
    }
    const channel = this.channelsRepository.create({
      title: title,
      owner: user,
      status: ChannelStatus.PRIVATE,
      reciveId: receiver.id,
    });
    const channelReturned = await this.channelsRepository.save(channel);
    const channelMember = this.channelMemberRepository.create({
      userId: user.id,
      channelId: channelReturned.id,
      type: MemberType.MEMBER,
    });
    this.channelsGateway.emitInMember(user.id, channelReturned.id);
    await this.channelMemberRepository.save(channelMember);

    const channelMember2 = this.channelMemberRepository.create({
      userId: receiver.id,
      channelId: channelReturned.id,
      type: MemberType.MEMBER,
    });
    this.channelsGateway.emitInMember(receiver.id, channelReturned.id);
    await this.channelMemberRepository.save(channelMember2);

    this.channelsGateway.EmitChannelDmInfo(channelReturned);
    return { channelId: channelReturned.id };
  }
  async reJoinOtherUserOnlyDm(channelId: number, user: User) {
    const curchannel = await this.channelsRepository.findByIdWithOwner(
      channelId,
    );
    if (!curchannel) throw new NotFoundException('CHANNEL NOT FOUND');
    const channelMember =
      await this.channelMemberRepository.findMemberByChannelId(curchannel.id);
    if (!channelMember) throw new NotFoundException('CHANNEL MEMBER NOT FOUND');
    const members = await this.getChannelMembers(channelId);
    if (members.length === 1) {
      if (!(await this.usersService.getUser(curchannel.reciveId)))
        throw new NotFoundException('USER NOT FOUND');
      if (curchannel.owner.id === user.id) {
        if (!(await this.friendsService.isFriend(curchannel.reciveId, user.id)))
          throw new NotFoundException('YOU ARE NOT FRIEND');
        if (await this.friendsService.isBlocked(curchannel.reciveId, user.id))
          return;
        const cm1 = await this.channelMemberRepository.create({
          userId: curchannel.reciveId,
          channelId: curchannel.id,
          type: MemberType.MEMBER,
        });
        await this.channelMemberRepository.save(cm1);
        this.channelsGateway.emitInMember(curchannel.reciveId, curchannel.id);
      } else {
        if (!(await this.usersService.getUser(curchannel.owner.id)))
          throw new NotFoundException('USER NOT FOUND');
        if (
          !(await this.friendsService.isFriend(
            curchannel.owner.id,
            curchannel.reciveId,
          ))
        )
          throw new NotFoundException('YOU ARE NOT FRIEND');
        if (
          await this.friendsService.isBlocked(
            curchannel.owner.id,
            curchannel.reciveId,
          )
        )
          return;
        const cm2 = await this.channelMemberRepository.create({
          userId: curchannel.owner.id,
          channelId: curchannel.id,
          type: MemberType.MEMBER,
        });
        await this.channelMemberRepository.save(cm2);
        this.channelsGateway.emitInMember(curchannel.owner.id, curchannel.id);
      }
    }
  }
  async leaveDmbySelf(user: User, otherUser: User) {
    // 닉네임 정렬해서 값찾기 ~ 똑같은거 찾아서 지우기
    const sortedNicknames = [user.nickname, otherUser.nickname].sort();
    const title = sortedNicknames[0] + sortedNicknames[1];
    const channel = await this.channelsRepository.findOnebyTitle(title);
    if (!channel) return;
    const channelMember =
      await this.channelMemberRepository.findOneChannelIdUserId(
        channel.id,
        user.id,
      );
    if (!channelMember) return;
    // if (!channel) throw new NotFoundException('CHANNEL NOT FOUND');
    // const channelMember = await this.channelMemberRepository.findOneBy({
    //   channelId: channel.id,
    //   userId: user.id,
    // });
    // if (!channelMember) throw new NotFoundException('CHANNEL MEMBER NOT FOUND');
    // this.channelsGateway.emitOutMember(user.id, +channel.id);
    await this.channelMemberRepository.delete({
      channelId: channel.id,
      userId: user.id,
    });
    this.channelsGateway.EmitBlockChannelOutSelf(channel);
  }

  async userEnterPrivateChannel(
    channelId: number,
    password: string,
    user: User,
    curChannel: Channel,
  ): Promise<returnStatusMessage> {
    if (password) {
      const inputPasswordMatches = await bcrypt.compare(
        password,
        curChannel.password,
      );
      if (!inputPasswordMatches) {
        throw new ForbiddenException('INVALID PASSWORD');
      } else {
        const isInUser =
          await this.channelMemberRepository.findOneChannelIdUserId(
            channelId,
            user.id,
          );
        if (isInUser) throw new BadRequestException('ALREADY IN THE CHANNEL');
        if (!isInUser) {
          const cm = this.channelMemberRepository.create({
            userId: user.id,
            channelId: channelId,
            type: MemberType.MEMBER,
          });
          this.channelMemberRepository.save(cm);
          this.channelsGateway.emitInMember(user.id, channelId);
        }
        return { message: 'ENTER CHANNEL IN SUCCESSFULLY', status: 200 };
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
    const isInUser = await this.channelMemberRepository.findOneChannelIdUserId(
      channelId,
      user.id,
    );
    if (isInUser) throw new BadRequestException('ALREADY IN THE CHANNEL');
    if (!isInUser) {
      const cm = this.channelMemberRepository.create({
        userId: user.id,
        channelId: channelId,
        type: MemberType.MEMBER,
      });
      this.channelMemberRepository.save(cm);
      this.channelsGateway.emitInMember(user.id, channelId);
    }
    return { message: 'ENTER CHANNEL IN SUCCESSFULLY', status: 200 };
  }

  async userEnterChannel(
    channelId: number,
    password: string,
    user: User,
  ): Promise<returnStatusMessage> {
    const curChannel = await this.channelsRepository.findCurChannelById(
      channelId,
    );
    if (curChannel.status === ChannelStatus.PRIVATE)
      throw new NotAcceptableException('WRONG ACCESS');
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
    const curChannelMember =
      await this.channelMemberRepository.findOneChannelIdUserId(
        channelId,
        userId,
      );
    if (curChannelMember.type === 'ADMIN') return true;
    return false;
  }

  async isPrivate(channelId: number) {
    const curChannel = await this.channelsRepository.findCurChannelById(
      channelId,
    );
    if (curChannel.status === ChannelStatus.PRIVATE) return true;
    return false;
  }

  async isOwnerinChannel(channelId: number, userId: number) {
    const curChannelMember =
      await this.channelMemberRepository.findOneChannelIdUserId(
        channelId,
        userId,
      );
    if (curChannelMember.type === 'OWNER') return true;
    return false;
  }

  async ownerGiveAdmin(channelId: number, toUserId: number, user: User) {
    const curChannel =
      await this.channelsRepository.findCurChannelWithMemberWithOwner(
        channelId,
      );
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
        this.channelsGateway.emitAdminInfo(toUserId, channelId);
      }
    }
  }

  // 소켓으로 'leave-room' event 가 오면 게이트웨이 에서 아래 함수가 호출하게끔
  async userExitChannel(channelId: string, userId: number) {
    try {
      const curChannel = await this.channelsRepository.findByIdwithOwnerMember(
        +channelId,
      );
      if (!curChannel) {
        throw new NotFoundException('CHANNEL DOSE NOT EXIST');
      }
      this.logger.log(
        `curChannel.owner.id : ${curChannel.owner.id}, userId : ${userId}`,
      );
      this.logger.debug(curChannel.status === ChannelStatus.PRIVATE);
      if (curChannel.status === ChannelStatus.PRIVATE) {
        if (curChannel.members.length === 1) {
          await this.channelMemberRepository.delete({ channelId: +channelId });
          this.channelsGateway.EmitDeletChannelInfo(curChannel);
          await this.channelsRepository.delete({ id: +channelId });
        } else {
          await this.channelMemberRepository.delete({
            userId: userId,
            channelId: +channelId,
          });
        }
      } else if (+curChannel.owner.id === +userId) {
        this.channelsGateway.emitOutMember(userId, +channelId);
        await this.channelMemberRepository.delete({ channelId: +channelId });
        this.channelsGateway.EmitDeletChannelInfo(curChannel);
        await this.channelsRepository.delete({ id: +channelId });
      } else {
        // 멤버에서만 delete
        //TODO:채널 안의 멤버 가 존재 하는지 안 하는지 쿼리
        const curChannelMembers = await this.channelMemberRepository
          .createQueryBuilder('channel_member')
          .where('channel_member.userId = :userId', { userId: userId })
          .getOne();
        if (!curChannelMembers)
          throw new NotFoundException('Member in this Channel does not exist!');
        else {
          this.channelsGateway.emitOutMember(userId, +channelId);
          await this.channelMemberRepository.delete({
            userId: userId,
            channelId: +channelId,
          });
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
    const isInUser =
      await this.channelBanMemberRepository.findOneChannelIdUserId(
        channelId,
        userId,
      );
    this.logger.log(
      `in this room banned in user : ${JSON.stringify(isInUser)}`,
    );
    if (isInUser) throw new MethodNotAllowedException('ALREADY BANNED');
    if (!isInUser) {
      const cm = await this.channelBanMemberRepository.create({
        userId: userId,
        channelId: channelId,
        expiresAt: new Date('9999-12-31T23:59:59.999Z'),
      });
      this.channelBanMemberRepository.save(cm);
    }
    this.userExitChannel(channelId.toString(), userId);
  }

  async postKickInChannel(channelId: number, userId: number, user: User) {
    const isInUser =
      await this.channelBanMemberRepository.findOneChannelIdUserIdWithQuery(
        channelId,
        userId,
      );
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
    // this.channelsGateway.exitWithSocketLeave(channelId, userId);
    this.userExitChannel(channelId.toString(), userId);
  }

  async isBanned(channelId: number, userId: number): Promise<boolean> {
    const ban = await this.channelBanMemberRepository.findOneChannelIdUserId(
      channelId,
      userId,
    );
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
      await this.cacheManager.set(key, mutelist, ttl);
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
    const curChannel = await this.channelsRepository.findByIdWithOwner(
      channelId,
    );
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

  async getUserFromSocket(client: Socket): Promise<User> {
    try {
      const cookie = client.handshake.headers.cookie;
      const { Authentication: authenticationToken } = parse(cookie);
      this.logger.debug(`authenticationToken: ${authenticationToken}`);
      const user: User = await this.authService.getUserFromAuthenticationToken(
        authenticationToken,
      );
      this.logger.log(`channel Service in user: ${JSON.stringify(user.id)}`);
      return user;
    } catch (err) {
      return null;
    }
  }

  async mappingUserToSocketId(
    // nsp: Namespace,
    userId: number,
    socketId: string,
  ): Promise<void> {
    const key = `user:${userId}:socket`;
    // this.logger.log(`mapping check key : ${key}, socketId : ${socketId}`);
    const mappingList = (await this.cacheManager.get<string>(key)) || [];
    this.logger.log(`check before value  mappingList : ${mappingList}`);
    // if (!mappingList.includes(socketId)) {
    // mappingList.splice(0);
    // mappingList.push(socketId);
    await this.cacheManager.set(key, socketId);
    // }
    // this.logger.log(`key : ${key} check mappingList : ${mappingList}`);
    const checkmappingList = (await this.cacheManager.get<string>(key)) || [];
    this.logger.log(`check after value  mappingList : ${checkmappingList}`);
  }

  async connectAlredyJoinedChannel(user: User, socket: Socket) {
    const myChannels = await this.getMyChannels(user);
    const channelIds: number[] = [];
    for (const channel of myChannels) {
      channelIds.push(channel.id);
    }
    this.channelsGateway.connectAlreadyChnnels(channelIds, socket);
  }

  async getSocketList(userId: number): Promise<string> {
    const key = `user:${userId}:socket`;
    this.logger.log(`check key ~ : ${key}, userId : ${userId}`);
    // const mappingList = (await this.cacheManager.get<string[]>(key)) || [];
    const socketlist = (await this.cacheManager.get<string>(key)) || null;
    this.logger.debug(`socketlist: ${socketlist}`);
    return socketlist;
  }

  async deletesocketCache(userId: number): Promise<void> {
    const key = `user:${userId}:socket`;
    await this.cacheManager.del(key);
  }

  async exitAlljoinedChannel(user: User): Promise<void> {
    const joinChannel = await this.getMyChannels(user);
    for (const channel of joinChannel) {
      await this.userExitChannel(channel.id.toString(), user.id);
      this.logger.log(`exit channel : ${channel.id}`);
      const remainmember = await this.channelsRepository.findByIdwithMember(
        channel.id,
      );
      if (channel.status === ChannelStatus.PRIVATE) {
        if (
          remainmember?.members.length === 1 ||
          remainmember?.members.length === 0 ||
          !remainmember
        ) {
          if (remainmember?.members[0].userId === user.id) {
            const curchannel = await this.channelsRepository.findById(
              channel.id,
            );
            await this.channelMemberRepository.delete({
              userId: curchannel.reciveId,
              channelId: channel.id,
            });
          }
          await this.channelMemberRepository.delete({
            userId: user.id,
            channelId: channel.id,
          });
          await this.channelsRepository.delete(channel.id);
        }
      }
    }
  }

  async deleteBanMember(user: User) {
    const banlist = await this.channelBanMemberRepository.findBanMemberByUserId(
      user.id,
    );
    for (const ban of banlist) {
      await this.channelBanMemberRepository.delete({
        userId: ban.userId,
        channelId: ban.channelId,
      });
    }
  }
}
