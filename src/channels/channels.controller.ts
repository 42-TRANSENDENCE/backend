import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiOperation,ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { User } from 'src/users/users.entity';
import { Users } from 'src/common/decorators/user.decorator';
import { CreateChannelDto } from './dto/create-chat.dto';

@ApiTags('CHANNEL')
@Controller('api/room_list')
export class ChannelsController {
    constructor(private channelsService: ChannelsService) {}

    // 일단 인자에 Users와 Param 은 필요 없음 (추후 확인후 첨삭 해야함)
    // 현재 user.id 를 그냥 1로 넣어주고 있음 ( 지금 로직에서도 안 쓰임 )
    @ApiOperation({ summary: '채팅방 모두 가져오기'})
    @Get('/')
    async getChannels(@Param('url',) url, @Users() user: User) {
        return this.channelsService.getChannels(url,1);
    }

    @ApiOperation({ summary: '채팅방 만들기'})
    @Post('/room')
    async createChannels(
        @Param('url') url,
        @Body() body: CreateChannelDto,
        @Users() user: User,
    ){
        return this.channelsService.createChannels(url,body.title,body.max, body.password, 1);
    }

}
