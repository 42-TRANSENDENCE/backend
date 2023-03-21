import { Controller, Get, Param, Post, Body, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { User } from 'src/users/users.entity';
import { Users } from 'src/common/decorators/user.decorator';
import { CreateChannelDto } from './dto/create-channel.dto';
import { EnterChannelDto } from './dto/enter-channel.dto';
import { Response } from 'express';

@ApiTags('CHANNEL')
@Controller('/room')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  // 일단 인자에 Users와 Param 은 필요 없음 (추후 확인후 첨삭 해야함)
  // 현재 user.id 를 그냥 1로 넣어주고 있음 ( 지금 로직에서도 안 쓰임 )
  @ApiOperation({ summary: '채팅방 모두 가져오기' })
  @Get()
  async getChannels() {
    // @Users() user: User
    return this.channelsService.getChannels();
  }

  @ApiOperation({ summary: '채팅방 만들기' })
  @Post()
  async createChannels(
    @Body() body: CreateChannelDto,
    // @Users() user: User,
  ) {
    // 처음 방을 만드는 유저의 아이디 에 해당 하는 닉네임을 보여줘야 한다.
    // 마지막 인자 1 -> user.nickname 으로 나중에
    return this.channelsService.createChannels(body.title, body.password, 2);
  }

  @ApiOperation({
    summary: '채팅방 정보 가져오기: [{ 멤버 }, { 밴리스트 }, private]',
  })
  @Get(':channelId')
  async getChannelInfo(@Param('channelId') channelId: number) {
    const result = await this.channelsService.getChannelInfo(channelId);
    // banMember 도 추가
    // private 인지 알러면 채팅방 에 쿼리로 접근해서 알아와야 하는데.
    return result;
  }

  @ApiOperation({ summary: '채팅방 입장' })
  @Post(':channelId')
  async userEnterChannel(
    @Param('channelId') channelId: number,
    @Body() enterDto: EnterChannelDto,
    @Users() user: User,
    @Res() res: Response,
  ) {
    const result = await this.channelsService.userEnterChannel(
      channelId,
      enterDto.password,
      user,
    );
    return res
      .status(result.status)
      .send({ statusCode: result.status, message: result.message });
  }

  @ApiOperation({ summary: '채팅방 owner 가 admin 권한을 줌' })
  @Post(':roomid/admin/:userid') // body 엔 아무것도 안 옴
  async ownerGiveAdmin(
    @Param('roomid') channelId: number,
    @Param('userid') toUserId: number,
    @Users() user: User,
  ) {
    return this.channelsService.ownerGiveAdmin(channelId, toUserId, user);
  }

  //TODO: 권한 설정으로 깔끔하게 처리 해야함.
  @ApiOperation({ summary: 'Ban 요청' })
  @Post('/room/:roomId/ban/:userId')
  async postBanInChannel(
    @Param('roomId') channelId: number,
    @Param('userId') userId: number,
    @Users() user: User,
  ) {
    return this.channelsService.postBanInChannel(channelId, userId, user);
  }

  @ApiOperation({ summary: 'Kick 요청' })
  @Post('/room/:roomId/kick/:userId')
  async postKickInChannel(
    @Param('roomId') channelId: number,
    @Param('userId') userId: number,
    @Users() user: User,
  ) {
    return this.channelsService.postKickInChannel(channelId, userId, user);
  }

  @ApiOperation({ summary: 'mute 요청' })
  @Post('/room/:roomId/mute/:userId')
  async postMuteInChannel(
    @Param('roomId') channelId: number,
    @Param('userId') userId: number,
    @Users() user: User,
  ) {
    return this.channelsService.postMuteInChannel(channelId, userId, user);
  }
}
