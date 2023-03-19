import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Header,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Put,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/auth/decorator/user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { FriendsService } from 'src/users/friends/friends.service';
import { userAvatarApiBody } from './users.constants';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly friendsService: FriendsService,
  ) {}

  @Get()
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: '로그인한 user 정보 반환' })
  async getUserInfo(@User() user) {
    return user;
  }

  // TODO: avatar type 저장
  @Get('avatar')
  @ApiOperation({ summary: '사용자 아바타 이미지 반환 (byte array)' })
  @UseGuards(JwtTwoFactorGuard)
  @Header('Content-Type', 'image/*')
  @Header('Content-Disposition', 'inline')
  async getUserAvatar(@User() user) {
    const avatar = await this.userService.getUserAvatar(user.id);
    return new StreamableFile(avatar);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtTwoFactorGuard)
  @Header('Content-Type', 'image/*')
  @Header('Content-Disposition', 'inline')
  @ApiOperation({
    summary: '사용자 아바타 변경 (3MB Limit, jpeg, bmp, jpg, png) ',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(userAvatarApiBody)
  @ApiOkResponse({
    description: '사용자 아바타 변경 완료. 변경한 이미지 데이터 반환',
  })
  async updateUserAvatar(
    @User() user,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 3 }),
          new FileTypeValidator({
            fileType: 'image/(jpg|jpeg|png|bmp)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return new StreamableFile(
      await this.userService.updateUserAvatar(user.id, file.buffer),
    );
  }

  @Delete()
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: '사용자 삭제', description: '회원 탈퇴' })
  deleteUser(@User() user) {
    return this.userService.deleteUser(user.id);
  }

  @Get('blocked')
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({
    summary: '차단한 친구 목록 조회',
    description: '차단한 친구의 id 조회',
  })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  getBlockedFriends(@User() user) {
    return this.userService.getBlockedUsers(user.id);
  }

  @Patch('block/:id')
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: '사용자 차단', description: '다른 사용자 차단' })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  blockUser(@User() user, @Param('id') id: number) {
    return this.userService.blockUser(user.id, id);
  }

  @Delete('block/:id')
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({
    summary: '사용자 차단 해제',
    description: '다른 사용자 차단 해제',
  })
  @ApiNotFoundResponse({ description: '사용자 정보 없음' })
  unblockUser(@User() user, @Param('id', ParseIntPipe) id: number) {
    return this.userService.unblockUser(user.id, id);
  }
}
