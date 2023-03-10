import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FourtyTwoGuard } from 'src/auth/guards/fourty-two.guard';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { CreateUserDto } from './dto/users.dto';
import { User } from './users.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @UseGuards(JwtTwoFactorGuard)
  async getUserInfo(@Req() req) {
    const user: User = req.user;
    return user;
  }

  @Get('avatar')
  @ApiOperation({ summary: '사용자 아바타 이미지 반환 (byte array)' })
  @UseGuards(JwtTwoFactorGuard)
  async getUserAvatar(@Req() req, @Res({ passthrough: true }) res: Response) {
    const avatar = await this.userService.getUserAvatar(req.user.id);

    res.set({
      'Content-Type': 'image/*',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(avatar);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtTwoFactorGuard)
  @ApiOperation({
    summary: '사용자 아바타 변경 기능 (3MB Limit, jpeg, bmp, jpg, png) ',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  updateUserAvatar(
    @Req() req,
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
    return this.userService.updateUserAvatar(req.user.id, file.buffer);
  }

  @Delete()
  @UseGuards(JwtTwoFactorGuard)
  deleteUser(@Req() req) {
    return this.userService.deleteUser(req.user.id);
  }
}
