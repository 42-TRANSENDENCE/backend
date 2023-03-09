import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiOperation,ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { User } from 'src/users/users.entity';
import { Users } from 'src/common/decorators/user.decorator';
import { CreateChannelDto } from './dto/create-channel.dto';
import { Socket} from 'socket.io';
@ApiTags('CHANNEL')
@Controller('api/room_list')
export class ChannelsController {
    constructor(private channelsService: ChannelsService) {}

    // 일단 인자에 Users와 Param 은 필요 없음 (추후 확인후 첨삭 해야함)
    // 현재 user.id 를 그냥 1로 넣어주고 있음 ( 지금 로직에서도 안 쓰임 )
    @ApiOperation({ summary: '채팅방 모두 가져오기'})
    @Get('/')
    async getChannels() { //@Param('url',) url, @Users() user: User
        return this.channelsService.getChannels();
    }

    @ApiOperation({ summary: '채팅방 만들기'})
    @Post('/room')
    async createChannels(
        // @Param('url') url,
        @Body() body: CreateChannelDto,
        @Users() user: User,
        // @Socket() client: Socket,
    ){
        // 처음 방을 만드는 유저의 아이디 에 해당 하는 닉네임을 보여줘야 한다.
        // 마지막 인자 1 -> user.nickname 으로 나중에 
        return this.channelsService.createChannels(body.title, body.password, 2);
    }

    @ApiOperation({ summary: '채팅방 정보 가져오기: [멤버, 밴리스트, private]'})
    @Get('/room/:channelId')
    async getChannelMembers(
        @Param('channelId') channelId: number,
    ){
        return this.channelsService.getChannelMembers(channelId);
    }

    @ApiOperation({ summary: '채팅방 입장'})
    @Post('/room/:channelId')
    async userEnterChannel(
        @Param('channelId') channelId : number,
        @Body() body: CreateChannelDto,
        @Users() user : User,
    ) {
        return this.channelsService.userEnterChannel(channelId,body.password,user)
    }

}
