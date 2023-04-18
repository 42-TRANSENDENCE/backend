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
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { GetUser } from 'src/common/decorator/user.decorator';
import { CreateChannelDto } from './dto/create-channel.dto';
import { EnterChannelDto } from './dto/enter-channel.dto';
import { Response } from 'express';
import { User } from 'src/users/users.entity';
import { JwtTwoFactorGuard } from 'src/common/guard/jwt-two-factor.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { JwtRefreshAuthGuard } from 'src/common/guard/jwt-refresh-auth.guard';

@ApiTags('CHAT')
@Controller('channels')
@UseInterceptors(ClassSerializerInterceptor)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @ApiOperation({ summary: '채팅방 모두 가져오기' })
  @ApiOkResponse({ description: '채팅방 목록 가져오기 성공(PRIVATE 빼고)' })
  @UseGuards(JwtTwoFactorGuard)
  @Get()
  async getChannels() {
    // return this.channelsService.getMyChannels(u)
    return this.channelsService.getChannels();
  }

  @ApiOperation({ summary: '채팅방 만들기' })
  @ApiOkResponse({ description: '만들기 완료' })
  @ApiBadRequestResponse({ description: '이미 존재하는 채널 이름' })
  @Post()
  @UseGuards(JwtTwoFactorGuard)
  async createChannels(@Body() body: CreateChannelDto, @GetUser() user: User) {
    return this.channelsService.createChannels(
      body.title,
      body.password,
      user.id,
    );
  }

  @ApiOperation({ summary: 'DM방 만들기' })
  @Post('dm')
  @UseGuards(JwtTwoFactorGuard)
  async createDMChannels(@GetUser() user: User, @Body() reciveUser: User) {
    return this.channelsService.createDMChannel(user, reciveUser);
  }

  @ApiOperation({ summary: '내 채팅방 목록 DM 포함' })
  @Get('mychannels')
  @UseGuards(JwtTwoFactorGuard)
  async getMyChannels(@GetUser() user) {
    // return this.channelsService.getMyChannels(user);
    return this.channelsService.getMyChannels(user);
  }

  @ApiOperation({
    summary: '채팅방 에대한 정보: [{ 멤버 + avatar + nickname}]',
  })
  @UseGuards(JwtTwoFactorGuard)
  @Get(':channelId')
  // @Param('id', ParseIntPipe) id: number
  // async getCahnnelInfo(@Param('channelId') channelId: number) {
  async getChannelInfo(@Param('channelId', ParseIntPipe) channelId: number) {
    const result = await this.channelsService.getChannelInfo(channelId);
    // banMember 도 추가
    // private 인지 알러면 채팅방 에 쿼리로 접근해서 알아와야 하는데.
    return result;
  }
  @ApiOperation({ summary: '채팅방 멤버 조회' })
  @UseGuards(JwtTwoFactorGuard)
  @Get(':channelId/members')
  async getChannelMembers(@Param('channelId', ParseIntPipe) channelId: number) {
    return await this.channelsService.getChannelMembers(channelId);
  }

  // @ApiOperation({ summary: '채팅방 멤버 조회1111111' })
  // @UseGuards(JwtTwoFactorGuard)
  // @Get(':channelId/memberss')
  // async getChannelMembersDto(
  //   @Param('channelId', ParseIntPipe) channelId: number,
  // ) {
  //   return await this.channelsService.getChannelMembersDto(channelId);
  // }

  @ApiOperation({ summary: '채팅방 최초 입장' })
  @Post(':channelId')
  @HttpCode(200)
  @UseGuards(JwtTwoFactorGuard)
  async userEnterChannel(
    @Param('channelId') channelId: number,
    @Body() enterDto: EnterChannelDto,
    @GetUser() user: User,
  ) {
    return await this.channelsService.userEnterChannel(
      channelId,
      enterDto.password,
      user,
    );
  }

  @ApiOperation({ summary: '채팅방 owner 가 admin 권한을 줌' })
  @Post(':channelid/admin/:userid') // body 엔 아무것도 안 옴
  async ownerGiveAdmin(
    @Param('channelid') channelId: number,
    @Param('userid') toUserId: number,
    @GetUser() user: User,
  ) {
    return this.channelsService.ownerGiveAdmin(channelId, toUserId, user);
  }

  //TODO: 권한 설정으로 깔끔하게 처리 해야함.
  @ApiOperation({ summary: 'Ban 요청' })
  @Post(':channelid/ban/:userId')
  async postBanInChannel(
    @Param('channelid') channelId: number,
    @Param('userId') userId: number,
    @GetUser() user: User,
  ) {
    return this.channelsService.postBanInChannel(channelId, userId, user);
  }

  @ApiOperation({ summary: 'Kick 요청' })
  @Post(':channelid/kick/:userId')
  async postKickInChannel(
    @Param('channelid') channelId: number,
    @Param('userId') userId: number,
    @GetUser() user: User,
  ) {
    // return this.channelsService.postKickInChannel(channelId, userId, user)
    return this.channelsService.addToKicklist(channelId, userId, 3000);
  }

  @ApiOperation({ summary: 'mute 요청' })
  @Post(':channelid/mute/:userId')
  async postMuteInChannel(
    @Param('channelid') channelId: number,
    @Param('userId') userId: number,
    @GetUser() user: User,
  ) {
    return this.channelsService.addToMutelist(channelId, userId, 3000);
  }
}
