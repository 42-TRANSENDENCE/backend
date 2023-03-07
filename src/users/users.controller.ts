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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FourtyTwoGuard } from 'src/auth/guards/fourty-two.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { CreateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @ApiSecurity('JWT access token')
  @UseGuards(JwtTwoFactorGuard)
  async getUserInfo(@Req() req) {
    return req.user;
  }

  @Get('avatar')
  @ApiOperation({ summary: 'get user avatar image byte array' })
  @UseGuards(JwtTwoFactorGuard)
  async getUserAvatar(@Req() req, @Res({ passthrough: true }) res: Response) {
    const avatar = await this.userService.getUserAvatar(req.user.id);

    res.set({
      'Content-Type': 'image',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(avatar);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'sign up',
    description: '42 Pong sign up 42 access token required',
  })
  @ApiSecurity('42 access token')
  @UseGuards(FourtyTwoGuard)
  signUp(@Body() createUserDto: CreateUserDto, @Req() req): any {
    const { id, image } = req.user;
    const { link } = image;
    this.userService.signUp(createUserDto, id, link);
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
    this.userService.updateUserAvatar(req.user.id, file.buffer);
  }

  @Delete()
  @ApiOperation({ summary: 'delete user' })
  @UseGuards(JwtTwoFactorGuard)
  deleteUser(@Req() req) {
    return this.userService.deleteUser(req.user.id);
  }
}
