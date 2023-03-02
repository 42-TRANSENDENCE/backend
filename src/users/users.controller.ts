import {
  Body,
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
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FourtyTwoGuard } from 'src/auth/guards/fourty-two.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'sign up',
    description: '42 Pong sign up 42 access token required',
  })
  @ApiConflictResponse({ description: 'nickname exists' })
  @ApiCreatedResponse({
    description: 'sign up success',
    schema: { example: { accessToken: 'xxx', refreshToken: 'xxx' } },
  })
  @ApiSecurity('42 access token')
  @UseGuards(FourtyTwoGuard)
  signUp(@Body(new ValidationPipe()) createUserDto: CreateUserDto, @Req() req) {
    const { id, image } = req.user;
    const { link } = image;
    return this.userService.signUp(createUserDto, id, link);
  }

  @Get()
  @ApiOperation({ summary: 'get user info' })
  @ApiSecurity('JWT access token')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@Req() req) {
    const { userId } = req.user;
    const user = await this.userService.getUserInfo(userId);
    return user;
  }

  @Get('avatar')
  @ApiOperation({ summary: 'get user avatar image byte array' })
  @UseGuards(JwtAuthGuard)
  async getUserAvatar(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { userId } = req.user;
    const avatar = await this.userService.getUserAvatar(userId);

    res.set({
      'Content-Type': 'image',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(avatar);
  }

  @Delete()
  @ApiOperation({ summary: 'delete user' })
  @UseGuards(JwtAuthGuard)
  deleteUser(@Req() req) {
    const { userId } = req.user;
    return this.userService.deleteUser(userId);
  }

  @Put('avatar')
  @ApiOperation({
    summary: 'change user avatar image (3MB Limit, jpeg, bmp, jpg, png) ',
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
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
    const { userId } = req.user;
    console.log(file);
    this.userService.updateUserAvatar(userId, file.buffer);
  }
}
