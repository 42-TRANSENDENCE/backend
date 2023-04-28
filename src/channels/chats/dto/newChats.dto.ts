import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../chats.entity';
export class newChatResponseDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  nickname: string;

  constructor(chat: Chat) {
    this.channelId = chat.channelId;
    this.content = chat.content;
    this.nickname = chat.sender.nickname;
  }
}
