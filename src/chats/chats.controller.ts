import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { User } from 'src/users/users.entity';
import { Users } from 'src/common/decorators/user.decorator';
import { ChatsDto } from './dto/chats.dto';

@Controller('test')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  // @ApiOperation({ summary: 채팅방 모두 가져오기})
  @Get(':url/chats') // @User user:Users
  async getChats(@Param('url') url, @Users() user: User) {
    return this.chatsService.getChats(url, 1);
  }

  // @ApiOperation({ summary: 특정 채팅방  가져오기})

  // @ApiOperation({ summary: 채팅방 만들기})
  @Post(':url/chats/:id/contents')
  async createChats(
    @Param('url') url,
    @Param('id') id: number, // ParseIntPipe
    @Body('content') content,
    @Body() chats: ChatsDto,
    @Users() user: User,
  ) {
    return this.chatsService.createChats(url, content, id, 12);
  }
}
