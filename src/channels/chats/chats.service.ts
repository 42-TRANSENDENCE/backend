import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  CACHE_MANAGER,
  Logger,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Chat } from './chats.entity';
import { User } from 'src/users/users.entity';
import { ChannelsGateway } from 'src/channels/events.chats.gateway';
import { Channel } from 'src/channels/entity/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { Cache } from 'cache-manager';
import { ChannelMember } from '../entity/channelmember.entity';
import { ChatResponseDto } from './dto/chats-response.dto';
import { FriendsService } from 'src/users/friends/friends.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat) private chatsRepository: Repository<Chat>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(ChannelMember)
    private channelMembersRepository: Repository<ChannelMember>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,

    @Inject(forwardRef(() => FriendsService))
    private readonly friendsService: FriendsService,

    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,

    private readonly channelsGateway: ChannelsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private logger = new Logger(ChatsService.name);

  async getChatsDto(channelId: number, user: User): Promise<ChatResponseDto[]> {
    const chatWithSender = await this.chatsRepository.find({
      where: { channelId: channelId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
    });
    const doBlocks = await this.friendsService.getAllDoBlocks(user);
    this.logger.debug(`get all block ${doBlocks}`);
    const memberDtos = chatWithSender
      .filter(
        (chat) =>
          !doBlocks.find((blockedUser) => blockedUser.id === chat.sender.id),
      )
      .map((sender) => {
        if (sender && sender.sender) {
          return new ChatResponseDto(sender);
        }
      });
    return memberDtos.filter((dto) => dto !== undefined);
  }
  async getChats(channelId: number, user: User) {
    if (await this.channelsService.isBanned(channelId, user.id))
      throw new NotAcceptableException('YOU ARE BANNED');
    return await this.getChatsDto(channelId, user);
  }
  //TODO: 채팅창 연결해서 User.id랑 연결해서 테스트 , 인자들 정리, entity 도 정리
  async isMutted(channelId: number, userId: number): Promise<boolean> {
    const mutelist = await this.channelsService.getMutelist(channelId);
    this.logger.log(`this is mutelist  :  ${mutelist} , ${mutelist.length}`);
    for (const Id of mutelist) {
      if (+Id === userId) {
        // this.logger.log(` id : ${Id}`);
        return true;
      }
    }
    return false;
  }
  async sendChatToChannel(channelId: number, chat: string, user: User) {
    if (await this.isMutted(channelId, user.id))
      throw new NotAcceptableException('YOU ARE MUTED');

    const channelMember = await this.channelMembersRepository.find({
      where: { channelId: channelId, userId: user.id },
    });
    if (channelMember.length === 0)
      throw new NotFoundException('YOU ARE NOT A MEMBER');

    const chats = this.chatsRepository.create({
      // senderUserId: user.id,
      sender: user,
      channelId: channelId,
      content: chat,
    });
    // this.logger.log(chats.sender.id);
    await this.chatsRepository.save(chats);
    //private 일때만 확인하게 하기
    if (await this.channelsService.isPrivate(channelId))
      await this.channelsService.reJoinOtherUserOnlyDm(channelId, user);

    // 여기 에서 채널의 상태가 Private일때만 상대방이 채팅방에 없을때 자동으로 넣어주기만 하고 join은 안 시키기.
    // Block이면 채팅안 보내기
    this.channelsGateway.sendEmitMessage(chats).catch((error) => {
      console.error('Failed to send message:', error);
    });
    this.channelsGateway.sendNewEmitMessage(chats);
  }
}
