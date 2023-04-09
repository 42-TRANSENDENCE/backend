import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Header,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Put,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { ModifyUserDto } from './dto/users.dto';
import { userAvatarApiBody } from './users.constants';
import { UsersService } from './users.service';
import { UserResponse } from './dto/user-response.dto';
import { UserSearchDto } from './dto/user-search.dto';
import { GetUser } from 'src/common/decorator/user.decorator';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: '로그인한 user 정보 반환' })
  @ApiOkResponse({ type: UserResponse })
  async getUserInfo(@GetUser() user) {
    return this.userService.getUser(user.id);
  }

  @Get('search/:nickname')
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: '닉네임으로 유저 정보 검색' })
  @ApiOkResponse({ type: UserSearchDto })
  getUserByNickname(@GetUser() user, @Param('nickname') nickname: string) {
    return this.userService.getByNickname(user, nickname);
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
  @ApiOkResponse({ description: '변경된 이미지 반환' })
  async updateUserAvatar(
    @GetUser() user,
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
      await this.userService.updateUserAvatar(user, file.buffer),
    );
  }

  @Delete()
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: '사용자 삭제', description: '회원 탈퇴' })
  deleteUser(@GetUser() user) {
    return this.userService.deleteUser(user.id);
  }

  @Patch('nickname')
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({ summary: 'nickname 변경' })
  @ApiOkResponse({ description: '변경 완료' })
  @ApiBadRequestResponse({ description: '이미 존재하는 닉네임 / 잘못된 입력' })
  modifyNickname(@GetUser() user, @Body() modifyUserDto: ModifyUserDto) {
    return this.userService.modifyNickname(user, modifyUserDto.nickname);
  }
}
