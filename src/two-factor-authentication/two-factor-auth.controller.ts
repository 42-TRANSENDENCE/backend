import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Header,
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
import { AuthService } from '../auth/auth.service';
import { GetUser } from '../common/decorator/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtTwoFactorGuard } from '../auth/guards/jwt-two-factor.guard';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorTokenDto } from './two-factor-token.dto';
import * as QRCode from 'qrcode';
import { User } from 'src/users/users.entity';

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
  @Header('Content-Type', 'image/png')
  register(@Res() res, @GetUser() user: User) {
    const secret = this.twoFactorAuthService.register(user);
    return QRCode.toFileStream(res, secret.otpauth_url);
  }

  @Post('validate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: TwoFactorTokenDto })
  @ApiOkResponse({ description: '2차 인증 성공' })
  @ApiUnauthorizedResponse({ description: '2차 인증 실패 (token invalid)' })
  async validate(
    @Req() req,
    @Body() twoFactorTokenDto: TwoFactorTokenDto,
    @GetUser() user: User,
  ) {
    this.twoFactorAuthService.verifyTwoFactorAuth(
      user.twoFactorSecret,
      twoFactorTokenDto.token,
    );
    const accessCookie = this.authService.getCookieWithJwtAccessToken(
      user.id,
      true,
    );
    req.res.setHeader('Set-Cookie', [accessCookie]);
    return;
  }

  @Post('turn-on')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: '2차 인증 활성화' })
  turnOn(@GetUser() user: User) {
    return this.twoFactorAuthService.turnOnTwoFactorAuthentication(user);
  }

  @Post('turn-off')
  @HttpCode(200)
  @UseGuards(JwtTwoFactorGuard)
  @ApiOkResponse({ description: '2차 인증 비활성화' })
  turnOff(@GetUser() user: User) {
    return this.twoFactorAuthService.turnOffTwoFactorAuthentication(user);
  }
}
