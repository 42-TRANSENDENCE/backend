import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { User } from 'src/users/users.entity';
import { GetUser } from 'src/common/decorator/user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('CHAT')
@Controller('/channles')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @ApiOperation({
    summary: '채팅방 에 해당하는 대화 내용 모두 가져오기',
  })
  @Get(':channelid/chat')
  async getChats(@Param('channelid') channelId, @GetUser() user: User) {
    return this.chatsService.getChats(channelId, 1);
  }

  @ApiOperation({ summary: '해당 채팅방에 채팅 전송' })
  @Post(':channelid/chat')
  async sendChatToChannel(
    @Param('channelid') id: number, // ParseIntPipe
    @Body('chat') chat: string,
    @GetUser() user: User,
  ) {
    // this.chatsService.createChats(chat,id,user)
    return this.chatsService.sendChatToChannel(id, chat, user);
  }
}
