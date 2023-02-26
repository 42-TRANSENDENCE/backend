import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiOperation,ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { User } from 'src/users/users.entity';
import { Users } from 'src/common/decorators/user.decorator';
import { CreateChannelDto } from './dto/create-chat.dto';

@ApiTags('CHANNEL')
@Controller('channels')
export class ChannelsController {
    constructor(private channelsService: ChannelsService) {}

    @ApiOperation({ summary: '채팅방 모두 가져오기'})
    @Get(':url/channels')
    async getChannels(@Param('url',) url, @Users() user: User) {
        return this.channelsService.getChannels(url,1);
    }

    @ApiOperation({ summary: '채널 만들기'})
    @Post(':url/channels')
    async createChannels(
        @Param('url') url,
        @Body() body: CreateChannelDto,
        @Users() user: User,
    ){
        return this.channelsService.createChannels(url,body.name,1);
    }

}
