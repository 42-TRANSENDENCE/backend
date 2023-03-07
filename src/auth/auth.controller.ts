import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOkResponse({
    description:
      '로그인 성공 cookie 설정 사용자 정보를 반환하지 않으면 2차인증 필요',
  })
  @ApiBearerAuth('42-token')
  @ApiNotFoundResponse({ description: '회원가입 필요' })
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
  @ApiOkResponse({
    description:
      'refresh token을 기반으로 새로운 access token을 cookie에 저장 기존 token이 만료되었을때 사용',
  })
  @ApiCookieAuth('Refresh')
  refresh(@Req() req) {
    const { id } = req.user;
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(id);
    req.res.setHeader('Set-Cookie', accessTokenCookie);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: '로그아웃. cookie token 삭제' })
  @ApiCookieAuth('Authentication')
  async logOut(@Req() req) {
    const { id } = req.user;
    await this.usersService.removeRefreshToken(id);
    const cookie = await this.authService.getCookieForLogOut();
    req.res.setHeader('Set-Cookie', cookie);
  }
}
