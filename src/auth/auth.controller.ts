import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { FourtyTwoGuard } from './guards/fourty-two.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @UseGuards(FourtyTwoGuard)
  @HttpCode(200)
  async login(@Req() req) {
    const { id } = req.user;

    const user = await this.usersService.getById(id);

    const accessCookie = this.authService.getCookieWithJwtAccessToken(id);
    const { refreshToken, refreshCookie } =
      this.authService.getCookieWithJwtRefreshToken(id);

    this.usersService.setCurrentRefreshToken(refreshToken, id);
    req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

    if (!user.isTwoFactorAuthenticationEnabled) {
      return user;
    }
    return;
  }

  @Get('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  refresh(@Req() req) {
    const { id } = req.user;
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(id);
    req.res.setHeader('Set-Cookie', accessTokenCookie);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logOut(@Req() req) {
    const { id } = req.user;
    await this.usersService.removeRefreshToken(id);
    const cookie = await this.authService.getCookieForLogOut();
    req.res.setHeader('Set-Cookie', cookie);
  }
}
