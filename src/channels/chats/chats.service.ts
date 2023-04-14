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
import { DataSource, Repository } from 'typeorm';
import { Chat } from './chats.entity';
import { User } from 'src/users/users.entity';
import { ChannelsGateway } from 'src/channels/events.chats.gateway';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { Cache } from 'cache-manager';
import { ChannelMember } from '../channelmember.entity';
// import { ChatResponseDto } from './dto/chats-response.dto';

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
  // async getChats(id: number, user): Promise<ChatResponseDto> {
  //   // const user = await this.userRepository.findOne({
  //   //   where: { id },
  //   //   relations: { achievements: true, wins: true, loses: true },
  //   // });
  //   // if (!user) {
  //   //   throw new NotFoundException(userNotFoundErr);
  //   // }
  //   const chat = await this.chatsRepository.findOne({
  //     where: { id },
  //     relations: { sender: true },
  //   });
  //   return new ChatResponseDto(user, chat);
  // }
  //TODO: 채팅창 연결해서 User.id랑 연결해서 테스트 , 인자들 정리, entity 도 정리
  async isMutted(roomId: number, userId: number): Promise<boolean> {
    const mutelist = await this.channelsService.getMutelist(roomId);
    this.logger.log(`this is mutelist  :  ${mutelist} , ${mutelist.length}`);
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
      sender: user,
      channelId: roomId,
      content: chat,
    });
    // this.logger.log(chats.sender.id);
    await this.chatsRepository.save(chats);
    // this.logger.log(JSON.stringify(chats.sender.id));
    // const test = await this.chatsRepository
    //   .createQueryBuilder('chat')
    //   .leftJoinAndSelect('chat.sender', 'sender')
    //   .where('chat.id = :id', { id: chats.id })
    //   .getOne();
    // this.logger.log(test.sender.id);
    const testChat = await this.chatsRepository.findOne({
      where: { id: chats.id },
      relations: {
        sender: true,
      },
    });
    // this.logger.log(`${testChat.content}`);
    // this.logger.log(`${testChat.sender.id}`);
    this.channelsGateway.sendEmitMessage(chats).catch((error) => {
      console.error('Failed to send message:', error);
    });
  }
}
