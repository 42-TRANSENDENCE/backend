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
    // 이거 따로 빼서 함수로 만들기. 민준's repository 참고
    const channelMember = this.channelMembersRepository.find({
      where: { channelId: roomId },
      relations: ['userId'],
    });
    if (!channelMember) throw new NotFoundException('YOU ARE NOT MEMBER');
    // 채팅 저장 , 일단 캐시에 다 넣고 나중에 한번에 저장 ?
    const chats = this.chatsRepository.create({
      // sender: user.id, //user.id,
      channelId: roomId,
      content: chat,
    });
    //savechat
    this.chatsRepository.save(chats);
    this.channelsGateway.sendEmitMessage(chats);
  }
}
