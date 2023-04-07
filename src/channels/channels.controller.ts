import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { User } from 'src/auth/decorator/user.decorator';
import { CreateChannelDto } from './dto/create-channel.dto';
import { EnterChannelDto } from './dto/enter-channel.dto';
import { Response } from 'express';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from 'src/auth/guards/jwt-refresh-auth.guard';
@ApiTags('CHAT')
@Controller('/channels')
// @UseInterceptors(ClassSerializerInterceptor)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  // 일단 인자에 Users와 Param 은 필요 없음 (추후 확인후 첨삭 해야함)
  // 현재 user.id 를 그냥 1로 넣어주고 있음 ( 지금 로직에서도 안 쓰임 )
  @ApiOperation({ summary: '채팅방 모두 가져오기' })
  @UseGuards(JwtTwoFactorGuard)
  @Get()
  async getChannels() {
    return this.channelsService.getChannels();
  }

  @ApiOperation({ summary: '채팅방 만들기' })
  @Post()
  @UseGuards(JwtTwoFactorGuard)
  async createChannels(@Body() body: CreateChannelDto, @User() user) {
    return this.channelsService.createChannels(
      body.title,
      body.password,
      user.id,
    );
  }

  @ApiOperation({
    summary:
      '채팅방 입장을 위한 정보 가져오기: [{ 멤버 }, { 밴리스트 }, private]',
  })
  @UseGuards(JwtTwoFactorGuard)
  @Get(':channelId')
  async getChannelInfo(@Param('channelId') channelId: number) {
    const result = await this.channelsService.getChannelInfo(channelId);
    // banMember 도 추가
    // private 인지 알러면 채팅방 에 쿼리로 접근해서 알아와야 하는데.
    return result;
  }

  @ApiOperation({ summary: '채팅방 최초 입장' })
  @Post(':channelId')
  @UseGuards(JwtTwoFactorGuard)
  async userEnterChannel(
    @Param('channelId') channelId: number,
    @Body() enterDto: EnterChannelDto,
    @User() user,
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
  @Post(':channelid/admin/:userid') // body 엔 아무것도 안 옴
  async ownerGiveAdmin(
    @Param('channelid') channelId: number,
    @Param('userid') toUserId: number,
    @User() user,
  ) {
    return this.channelsService.ownerGiveAdmin(channelId, toUserId, user);
  }

  //TODO: 권한 설정으로 깔끔하게 처리 해야함.
  @ApiOperation({ summary: 'Ban 요청' })
  @Post(':channelid/ban/:userId')
  async postBanInChannel(
    @Param('channelid') channelId: number,
    @Param('userId') userId: number,
    @User() user,
  ) {
    return this.channelsService.postBanInChannel(channelId, userId, user);
  }

  @ApiOperation({ summary: 'Kick 요청' })
  @Post(':channelid/kick/:userId')
  async postKickInChannel(
    @Param('channelid') channelId: number,
    @Param('userId') userId: number,
    @User() user,
  ) {
    // return this.channelsService.postKickInChannel(channelId, userId, user)
    return this.channelsService.addToKicklist(channelId, userId, 3000);
  }

  @ApiOperation({ summary: 'mute 요청' })
  @Post(':channelid/mute/:userId')
  async postMuteInChannel(
    @Param('channelid') channelId: number,
    @Param('userId') userId: number,
    @User() user,
  ) {
    return this.channelsService.addToMutelist(channelId, userId, 3000);
  }
}
