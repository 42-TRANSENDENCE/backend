import {
  Injectable,
  Logger,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { User } from 'src/users/users.entity';
import { ChannelsGateway } from 'src/channels/events.chats.gateway';
import { ChannelsService } from 'src/channels/channels.service';
import { ChatResponseDto } from './dto/chats-response.dto';
import { FriendsService } from 'src/users/friends/friends.service';
import { MemberRepository } from '../repository/member.repository';
import { ChatsRepository } from './chats.repository';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly channelMembersRepository: MemberRepository,

    private readonly friendsService: FriendsService,

    private readonly channelsService: ChannelsService,

    private readonly channelsGateway: ChannelsGateway,
  ) {}
  private logger = new Logger(ChatsService.name);

  async getChatsDto(channelId: number, user: User): Promise<ChatResponseDto[]> {
    const chatWithSender = await this.chatsRepository.getChatsWithSenderASC(
      channelId,
    );
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

  async isMutted(channelId: number, userId: number): Promise<boolean> {
    const mutelist = await this.channelsService.getMutelist(channelId);
    this.logger.log(`this is mutelist  :  ${mutelist} , ${mutelist.length}`);
    for (const Id of mutelist) {
      if (+Id === userId) {
        return true;
      }
    }
    return false;
  }
  async sendChatToChannel(channelId: number, chat: string, user: User) {
    if (await this.isMutted(channelId, user.id))
      throw new NotAcceptableException('YOU ARE MUTED');

    const channelMember =
      await this.channelMembersRepository.findOneChannelIdUserId(
        channelId,
        user.id,
      );
    if (!channelMember) throw new NotFoundException('YOU ARE NOT A MEMBER');

    const chats = this.chatsRepository.create({
      sender: user,
      channelId: channelId,
      content: chat,
    });
    await this.chatsRepository.save(chats);
    if (await this.channelsService.isPrivate(channelId))
      await this.channelsService.reJoinOtherUserOnlyDm(channelId, user);

    this.channelsGateway.sendEmitMessage(chats).catch((error) => {
      console.error('Failed to send message:', error);
    });
    this.channelsGateway.sendNewEmitMessage(chats);
  }
}
