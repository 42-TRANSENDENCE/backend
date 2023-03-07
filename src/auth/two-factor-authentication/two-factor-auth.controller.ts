import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtTwoFactorGuard } from '../guards/jwt-two-factor.guard';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorToken } from './two-factor-token.dto';

@ApiTags('2fa')
@Controller('2fa')
@UseInterceptors(ClassSerializerInterceptor)
export class TwoFactorAuthController {
  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'Google Authenticator에 등록할 QR Code 반환',
  })
  async register(@Req() req, @Res() res) {
    const otpUrl = await this.twoFactorAuthService.generateTwoFactorAuthSecret(
      req.user.id,
    );
    req.res.setHeader('Content-Type', 'image/png');
    return this.twoFactorAuthService.pipeQRCodeStream(res, otpUrl);
  }

  @Post('validate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: TwoFactorToken })
  @ApiOkResponse({ description: '2차 인증 성공' })
  @ApiUnauthorizedResponse({ description: '2차 인증 실패 (token invalid)' })
  async validate(@Req() req, @Body('token') twoFactorToken: TwoFactorToken) {
    await this.twoFactorAuthService.verifyTwoFactorAuth(
      req.user.id,
      twoFactorToken.token,
    );
    const accessCookie = this.authService.getCookieWithJwtAccessToken(
      req.user.id,
      true,
    );
    req.res.setHeader('Set-Cookie', [accessCookie]);
  }

  @Post('turn-on')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: '2차 인증 활성화' })
  async turnOn(@Req() req) {
    await this.usersService.turnOnTwoFactorAuthentication(req.user.id);
  }

  @Post('turn-off')
  @HttpCode(200)
  @UseGuards(JwtTwoFactorGuard)
  @ApiOkResponse({ description: '2차 인증 비활성화' })
  async turnOff(@Req() req) {
    await this.usersService.turnOffTwoFactorAuthentication(req.user.id);
  }
}
