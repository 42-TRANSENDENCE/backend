import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { FriendResponseDto } from './dto/friend.response.dto';
import { GetUser } from 'src/common/decorator/user.decorator';
import { JwtTwoFactorGuard } from 'src/common/guard/jwt-two-factor.guard';
import { ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Controller('users/friends')
@UseGuards(JwtTwoFactorGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('users/friends')
@ApiUnauthorizedResponse({ description: '로그인이 필요합니다.' })
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: '모든 친구 조회' })
  @ApiOkResponse({ type: [FriendResponseDto] })
  async getAllFriends(@GetUser() user): Promise<FriendResponseDto[]> {
    const friends = await this.friendsService.getAllFriends(user);
    return friends.map((friend) => {
      return new FriendResponseDto(friend);
    });
  }

  @Get('pending')
  @ApiOperation({
    summary: '보낸 친구 요청 조회',
    description: '보낸 친구요청을 아직 수락하지 않은 사용자들을 반환',
  })
  @ApiOkResponse({ type: [FriendResponseDto] })
  async getPendingRequests(@GetUser() user): Promise<FriendResponseDto[]> {
    return (await this.friendsService.getPendingRequests(user)).map(
      (pendingRequest) => new FriendResponseDto(pendingRequest),
    );
  }

  @Get('received')
  @ApiOperation({
    summary: '받은 친구 요청 조회',
    description: '나에게 친구 요청을 보낸 사용자들을 반환',
  })
  @ApiOkResponse({ type: [FriendResponseDto] })
  async receivedRequest(@GetUser() user): Promise<FriendResponseDto[]> {
    return (await this.friendsService.getReceivedFriendships(user)).map(
      (receivedRequest) => new FriendResponseDto(receivedRequest),
    );
  }

  @ApiOperation({ summary: 'Block 리스트 조회' })
  @Get('blocklist')
  @UseGuards(JwtTwoFactorGuard)
  async getBlockList(@GetUser() user) {
    return this.friendsService.getBlockedArray(user);
  }

  @Post('request/:id')
  @ApiOperation({
    summary: '친구 요청',
    description: '다른 사용자에게 친구 요청',
  })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  requestFriendship(@GetUser() user, @Param('id') id: number) {
    return this.friendsService.requestFriendship(user, id);
  }

  @Delete('request/:id')
  @ApiOperation({
    summary: '친구 요청 삭제',
    description: '보낸 친구 요청 삭제',
  })
  @ApiNotFoundResponse({
    description: '친구 요청 정보 없음',
  })
  deleteRequest(@GetUser() user, @Param('id') id: number) {
    return this.friendsService.deleteRequest(user.id, id);
  }

  @Delete('received/:id')
  @ApiOperation({
    summary: '친구 요청 거절',
    description: '받은 친구 요청 삭제',
  })
  deleteReceived(@GetUser() user, @Param('id') id: number) {
    return this.friendsService.deleteRequest(id, user.id);
  }

  @Put('approve/:id')
  @ApiOperation({
    summary: '친구 요청 수락',
    description: '받은 친구 요청 수락',
  })
  @ApiNotFoundResponse({ description: '친구 요청 정보 없음' })
  approveFriendship(@GetUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.friendsService.approveFriendship(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '친구 삭제',
    description: '친구 삭제 (이미 친구 관계)',
  })
  @ApiNotFoundResponse({ description: '친구 관계 정보 없음' })
  deleteFriend(@GetUser() user, @Param('id') id: number) {
    return this.friendsService.deleteFriendship(user, id);
  }

  @Post('request/block/:id')
  @ApiOperation({
    summary: '친구 block 요청',
    description: '다른 사용자에게 친구 block 요청',
  })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  requestBlockship(
    @GetUser() user,
    @Param('id') id: number,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.friendsService.requestBlockship(user, id, socket);
  }

  @Delete('block/:id')
  @ApiOperation({
    summary: '친구 block 삭제',
    description: '친구 block 삭제 (이미 친구 block 관계)',
  })
  @ApiNotFoundResponse({ description: '친구 관계 정보 없음' })
  deleteBlocked(@GetUser() user, @Param('id') id: number) {
    return this.friendsService.deleteBlockship(user, id);
  }
}
