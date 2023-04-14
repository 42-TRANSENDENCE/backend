import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { User } from 'src/users/users.entity';
import { GetUser } from 'src/common/decorator/user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/common/guard/jwt-two-factor.guard';
import { ChatsDto } from './dto/chats-input.dto';

@ApiTags('CHAT')
@Controller('chat')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @ApiOperation({
    summary: '채팅방 에 해당하는 대화 내용 모두 가져오기',
  })
  @UseGuards(JwtTwoFactorGuard)
  @Get(':channelId')
  async getChats(
    @Param('channelId', ParseIntPipe) channelId: number,
    @GetUser() user: User,
  ) {
    return this.chatsService.getChats(channelId, user.id);
  }

  @ApiOperation({ summary: '해당 채팅방에 채팅 전송' })
  @UseGuards(JwtTwoFactorGuard)
  @Post(':channelId')
  async sendChatToChannel(
    @Param('channelId', ParseIntPipe) id: number,
    @Body() chat: ChatsDto,
    @GetUser() user: User,
  ) {
    // this.chatsService.createChats(chat,id,user)
    return this.chatsService.sendChatToChannel(id, chat.content, user);
  }
}
