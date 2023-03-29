import {
  HttpCode,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Res,
  Inject,
  forwardRef,
  MethodNotAllowedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { ChannelsGateway } from 'src/events/events.channels.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { response } from 'express';
import { returnStatusMessage } from './channel.interface';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @Inject(forwardRef(() => ChannelsGateway))
    private readonly channelsGateway: ChannelsGateway,
  ) {}
  private logger = new Logger(ChannelsService.name);

  async findById(id: number) {
    return this.channelsRepository.findOne({ where: { id } });
  }
  async findByIdMember(id: number) {
    return this.channelMemberRepository.findOne({ where: { id } });
  }

  async getChannels() {
    return this.channelsRepository.createQueryBuilder('channels').getMany();
  }
  async createChannels(title: string, password: string, myId: number) {
    const saltRounds = 10;
    const channel = this.channelsRepository.create({
      title: title,
      password,
      owner: myId,
    });
    if (password) {
      const hashedPassword = await bcrypt.hash(password.toString(), saltRounds);
      channel.private = true;
      channel.password = hashedPassword;
    }
    // channel.owner = User.getbyid()~ 해서 나중에 merge 하고 연결 해주자
    const channelReturned = await this.channelsRepository.save(channel);
    this.channelsGateway.EmitChannelInfo(channelReturned);
    const channelMember = this.channelMemberRepository.create({
      UserId: myId,
      ChannelId: channelReturned.id,
    });
    await this.channelMemberRepository.save(channelMember);
  }

  // 방이 없을때 예외 처리
  async getChannelInfo(channelId: number) {
    const channel = await this.findById(channelId);
    if (channel) {
      const channelMembers = await this.getChannelMembers(channelId);
      const result = [channelMembers, channel.private];
      return result;
    } else throw new NotFoundException('Check the channelId if there is exist');
  }

  // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
  async getChannelMembers(channelId: number) {
    return this.channelMemberRepository.find({
      where: { ChannelId: channelId },
    });
  }

  async userEnterPrivateChannel(
    channelId: number,
    password: string,
    user: User,
    curChannel: Channels,
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
          .where('channel_member.UserId = :userId', { userId: 1 })
          .getOne();
        // console.log(isInUser)
        if (!isInUser) {
          const cm = this.channelMemberRepository.create({
            UserId: 1, // user.id
            ChannelId: channelId,
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
    password: string,
    user: User,
    curChannel: Channels,
  ): Promise<{ message: string; status: number }> {
    // 공개방은 무조건 소켓 연결 근데 + 밴 리스트 !! 는 나중에
    // this.channelsGateway.nsp.emit('join-room');
    const isInUser = await this.channelMemberRepository
      .createQueryBuilder('channel_member')
      .where('channel_member.UserId = :userId', { userId: 1 }) // 1 -> user.id
      .getOne();
    // console.log(isInUser)
    if (!isInUser) {
      const cm = this.channelMemberRepository.create({
        UserId: 1, // user.id
        ChannelId: channelId,
      });
      this.channelMemberRepository.save(cm);
    }
    return { message: 'Enter Channel in successfully', status: 200 };
  }

  async userEnterChannel(
    channelId: number,
    password: string,
    user: User,
  ): Promise<{ message: string; status: number }> {
    const curChannel = await this.channelsRepository.findOneBy({
      id: channelId,
    });
    if (!curChannel) throw new NotFoundException('Plz Enter Exist Room');
    if (curChannel.private)
      return this.userEnterPrivateChannel(
        channelId,
        password,
        user,
        curChannel,
      );
    return this.userEnterPublicChannel(channelId, password, user, curChannel);
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
    const curChannel = await this.findById(channelId);
    if (curChannel.owner == toUserId)
      throw new MethodNotAllowedException('Owner could not downgrade admin');
    // 채팅방의 Owner가 현재 명령한  userid와 일치 할때  근데 지금은  user가 연동이 안 되어 있닌까
    // if(user.id == curChannel.owner)
    // owner 가 admin을 자기 자신한테 주면 그냥 owner되게 하기
    {
      curChannel.admin = toUserId;
      this.channelsRepository.save(curChannel);
    }
  }

  // 소켓으로 'leave-room' event 가 오면 게이트웨이 에서 아래 함수가 호출하게끔 해야 하나??
  // 이거 내가 try catch로 예외처리 해놓음
  async userExitChannel(
    socket: Socket,
    roomId: string,
    userId: number,
  ): Promise<void> {
    // 이러면 내가 무슨 user 인지 알수 있나 .. ?
    // roomId  가 채널의 id 이겠지 ?
    // 채팅방 오너가 나가면 채팅방 삭제.
    const curChannel = await this.findById(+roomId);
    // 근데 만약 그 채널에 없는 사람이 leave-room 이벤트 보내는 경우도 생각.
    if (!curChannel) throw new WsException('Check the room number');
    if (curChannel.owner === userId) {
      // 멤버 먼저 삭제 하고  방자체를 삭제 ? 아님 그냥 방삭제
      // this.logger.log('is this herererererer');
      this.channelMemberRepository.delete({ ChannelId: +roomId });
      this.channelsRepository.delete({ id: +roomId });
    } else {
      // 멤버에서만 delete
      // const curChannelMembers = await this.findByIdMember(+roomId)
      this.channelMemberRepository.delete({
        UserId: userId,
        ChannelId: +roomId,
      });
    }
    // this.logger.log('here what it is -------');
  }
}
