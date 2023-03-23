import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from 'src/auth/decorator/user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { FriendsService } from './friends.service';

@Controller('users/friends')
@UseGuards(JwtTwoFactorGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('users/friends')
@ApiUnauthorizedResponse({ description: '로그인이 필요합니다.' })
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({
    summary: '모든 친구 조회',
    description: '차단 친구를 제외한 모든 친구 조회',
  })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  getAllFriends(@User() user) {
    return this.friendsService.getAllFriends(user.id);
  }

  @Get('pending')
  @ApiOperation({
    summary: '보낸 친구 요청 조회',
    description: '아직 수락하지 않은 친구 요청 조회',
  })
  getPendingRequests(@User() user) {
    return this.friendsService.getPendingRequests(user);
  }

  @Get('received')
  @ApiOperation({
    summary: '받은 친구 요청 조회',
    description: '받은 친구 요청 조회',
  })
  receivedRequest(@User() user) {
    return this.friendsService.receivedFriendship(user);
  }

  @Post('request/:id')
  @ApiOperation({
    summary: '친구 요청',
    description: '다른 사용자에게 친구 요청',
  })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  requestFriendship(@User() user, @Param('id') id: number) {
    return this.friendsService.requestFriendship(user, id);
  }

  @Delete('request/:id')
  @ApiOperation({
    summary: '친구 요청 삭제',
    description: '보낸 친구 요청 삭제, 친구 요청 거절 두가지 용도',
  })
  @ApiNotFoundResponse({
    description: '친구 요청 정보 없음',
  })
  deleteRequestedFriendship(@User() user, @Param('id') id: number) {
    return this.friendsService.deleteRequestedFriendship(user, id);
  }

  @Put('approve/:id')
  @ApiOperation({
    summary: '친구 요청 수락',
    description: '받은 친구 요청 수락',
  })
  @ApiNotFoundResponse({ description: '친구 요청 정보 없음' })
  approveFriendship(@User() user, @Param('id') id: number) {
    return this.friendsService.approveFriendship(user, id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '친구 삭제',
    description: '친구 삭제 (이미 친구 관계)',
  })
  @ApiNotFoundResponse({ description: '친구 관계 정보 없음' })
  deleteFriend(@User() user, @Param('id') id: number) {
    return this.friendsService.deleteFriendship(user, id);
  }
}
