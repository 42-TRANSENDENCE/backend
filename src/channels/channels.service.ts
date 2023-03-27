import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelcember.entity';
import { ChannelsGateway } from 'src/events/events.channels.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    private readonly channelsGateway: ChannelsGateway,
  ) {}
  private logger = new Logger(ChannelsService.name);

  // async findById(id: number) {
  //     return this.channelsRepository.findOne({ where: { id } });
  // }
  async getChannels() {
    return this.channelsRepository.createQueryBuilder('channels').getMany();
  }

  async createChannels(title: string, password: string, myId: number) {
    const saltRounds = 10;
    const channel = this.channelsRepository.create({
      title: title,
      password: password,
      owner: myId,
    });
    if (password) {
      const hashedPassword = await bcrypt.hash(password.toString(), saltRounds);
      channel.private = true;
      channel.password = hashedPassword;
    }
    // channel.owner = User.getbyid()~ 해서 나중에 merge 하고 연결 해주자
    const channelReturned = await this.channelsRepository.save(channel);
    this.logger.log('channelReturned:', channelReturned.title);
    // this.channelsGateway.nsp.server.emit('create-room', {message:`${channelReturned.title}`});
    const channelMember = this.channelMemberRepository.create({
      UserId: myId,
      ChannelId: channelReturned.id,
    });
    await this.channelMemberRepository.save(channelMember);
  }

  // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
  async getChannelMembers(channel_id: number) {
    return this.channelMemberRepository
      .createQueryBuilder('channel_member')
      .where('channel_member.ChannelId = :channel_id', { channel_id })
      .getMany();
  }

  async userEnterChannel(channel_id: number, password: string, user: User) {
    const curChannel = await this.channelsRepository.findOne({
      where: { id: channel_id },
    });
    if (curChannel) {
      if (curChannel.private)
        return this.userEnterPrivateChannel(
          channel_id,
          password,
          user,
          curChannel,
        );
      else
        return this.userEnterPublicChannel(
          channel_id,
          password,
          user,
          curChannel,
        );
    } else throw new UnauthorizedException('Plz Enter Exist Room');
  }

  async userEnterPrivateChannel(
    channel_id: number,
    password: string,
    user: User,
    curChannel: Channels,
  ) {
    //private 일때 패스워드 hash compare해서 맞는지 만 체크
    // 소켓 연결은 나중에
    // 맞으면 채팅방 멤버에추가 해줘야한다. -> channel member entitiy 에 insert 하는거 추가 해야함.
    // const curChannel = await this.channelsRepository.createQueryBuilder()
    // .where('id = :channel_id', {channel_id})
    // .getOne();
    if (password) {
      this.logger.log(`channel password: ${(await curChannel).password}`);
      const inputPasswordMatches = await bcrypt.compare(
        password,
        (
          await curChannel
        ).password,
      );
      this.logger.log(inputPasswordMatches);
      if (!inputPasswordMatches) {
        throw new UnauthorizedException('Invalid password');
      } else {
        // 맞으면 소켓 연결하고 디비에 추가 채널멤버에 .
        this.logger.log('suceccses');
      }
    } else {
      // 비번방인데 비밀번호 입력 안 했을때
      throw new UnauthorizedException('Invalid password');
    }
    return curChannel;
  }

  async userEnterPublicChannel(
    channel_id: number,
    password: string,
    user: User,
    curChannel: Channels,
  ) {
    // 공개방은 무조건 소켓 연결 근데 + 밴 리스트 !! 는 나중에
    return curChannel;
  }
}
