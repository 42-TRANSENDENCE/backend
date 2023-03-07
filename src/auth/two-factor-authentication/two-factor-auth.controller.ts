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
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtTwoFactorGuard } from '../guards/jwt-two-factor.guard';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorToken } from './two-factor-token.interface';

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
  async register(@Req() req, @Res() res) {
    const otpUrl = await this.twoFactorAuthService.generateTwoFactorAuthSecret(
      req.user.id,
    );
    return this.twoFactorAuthService.pipeQRCodeStream(res, otpUrl);
  }

  @Post('validate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async validate(@Req() req, @Body('token') twoFactorToken: TwoFactorToken) {
    await this.twoFactorAuthService.verifyTwoFactorAuth(
      req.user.id,
      twoFactorToken.token,
    );
    const accessCookie = this.authService.getCookieWithJwtAccessToken(
      req.user.id,
      true,
    );
    console.log(accessCookie);
    req.res.setHeader('Set-Cookie', [accessCookie]);
  }

  @Post('turn-on')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async turnOn(@Req() req) {
    await this.usersService.turnOnTwoFactorAuthentication(req.user.id);
  }

  @Post('turn-off')
  @HttpCode(200)
  @UseGuards(JwtTwoFactorGuard)
  async turnOff(@Req() req) {
    await this.usersService.turnOffTwoFactorAuthentication(req.user.id);
  }
}
