import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../chats.entity';
export class newChatResponseDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  content: string;

  constructor(chat: Chat) {
    this.channelId = chat.channelId;
    this.content = chat.content;
  }
}
