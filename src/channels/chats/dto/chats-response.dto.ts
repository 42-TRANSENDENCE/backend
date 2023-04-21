import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../chats.entity';
export class ChatResponseDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  senderUserNickname: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  senderUserId: number;

  constructor(chat: Chat) {
    this.channelId = chat.channelId;
    this.senderUserNickname = chat.sender.nickname;
    this.content = chat.content;
    this.createdAt = chat.createdAt;
    this.senderUserId = chat.sender.id;
  }
}
