import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  CACHE_MANAGER,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chats.entity';
import { User } from 'src/users/users.entity';
import { ChannelsGateway } from 'src/channels/events.chats.gateway';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { Cache } from 'cache-manager';
import { ChannelMember } from '../channelmember.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat) private chatsRepository: Repository<Chat>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(ChannelMember)
    private channelMembersRepository: Repository<ChannelMember>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,

    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,

    private readonly channelsGateway: ChannelsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private logger = new Logger(ChatsService.name);
  async getChats(channelId: number, myId: number) {
    return this.chatsRepository.find({ where: { channelId: channelId } });
  }

  //TODO: 채팅창 연결해서 User.id랑 연결해서 테스트 , 인자들 정리, entity 도 정리
  async isMutted(roomId: number, userId: number): Promise<boolean> {
    const mutelist = await this.channelsService.getMutelist(roomId);
    this.logger.log(`this is chatsservice :  ${mutelist}`);
    for (const Id of mutelist) {
      if (+Id === userId) {
        // this.logger.log(` id : ${Id}`);
        return true;
      }
    }
    return false;
  }
  async sendChatToChannel(roomId: number, chat: string, user: User) {
    if (await this.isMutted(roomId, user.id))
      throw new UnauthorizedException('YOU ARE MUTED');

    const channelMember = await this.channelMembersRepository.find({
      where: { channelId: roomId, userId: user.id },
    });

    if (channelMember.length === 0)
      throw new NotFoundException('YOU ARE NOT A MEMBER');

    const chats = this.chatsRepository.create({
      senderUserId: user.id,
      channelId: roomId,
      content: chat,
    });

    await this.chatsRepository.save(chats);

    this.channelsGateway.sendEmitMessage(chats).catch((error) => {
      console.error('Failed to send message:', error);
    });
  }
}
