import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../chats.entity';
export class newChatResponseDto {
  @ApiProperty()
  channelId: number;

  constructor(chat: Chat) {
    this.channelId = chat.channelId;
  }
}
