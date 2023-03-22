import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { User } from 'src/users/users.entity';
import { Users } from 'src/channels/common/decorators/user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('CHAT')
@Controller('/room')
export class ChatsController {
    constructor(private chatsService: ChatsService) {}

    // @ApiOperation({ summary: 채팅방 모두 가져오기})
    @Get(':channelId/chat')       // @User user:Users
    async getChats(@Param('channelId') channel_id, @Users() user:User) {
        return this.chatsService.getChats(channel_id, 1);
    }

    // @ApiOperation({ summary: 특정 채팅방  가져오기})
    // 보내기전에 디비랑 연결 하는 부분 아직 안 함 
    @ApiOperation({ summary: "해당 채팅방에 채팅 전송" })
    @Post(':channelId/chat')
    async sendChatToChannel(
        // 이거  DTO만들어서 예외처리 
        @Param('channelId') id:number, // ParseIntPipe 
        @Body('chat') chat:string,
        @Users() user:User,
    ){
        // this.chatsService.createChats(chat,id,user)
        return this.chatsService.sendChatToChannel(id,chat,user);
    }

}
