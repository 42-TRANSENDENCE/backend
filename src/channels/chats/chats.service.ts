import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  CACHE_MANAGER,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chats } from './chats.entity';
import { User } from 'src/users/users.entity';
import { ChannelsGateway } from 'src/channels/events.chats.gateway';
import { Channels } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { Cache } from 'cache-manager';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chats) private chatsRepository: Repository<Chats>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,

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
    if (await this.isMutted(roomId, 2))
      throw new UnauthorizedException('YOU ARE MUTED');
    const chats = this.chatsRepository.create({
      senderId: 2, //user.id,
      channelId: roomId,
      content: chat,
    });
    //savechat
    this.chatsRepository.save(chats);
    this.channelsGateway.sendEmitMessage(chats);
  }
}
