import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService, JwtTokens, QRCodeUrl } from './auth.service';
import { FourtyTwoGuard } from './guards/fourty-two.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @ApiOperation({
    summary: 'login',
    description: '42 Pong blogin',
  })
  @ApiOkResponse({
    description: 'login success',
    schema: { example: { accessToken: 'xxx', refreshToken: 'xxx' } },
  })
  @ApiNotFoundResponse({ description: 'user not found' })
  @ApiUnauthorizedResponse({
    description: 'two-factor authentication required',
  })
  @UseGuards(FourtyTwoGuard)
  login(@Req() req): Promise<JwtTokens> {
    const { id } = req.user;
    return this.authService.login(id);
  }

  @Get('refresh')
  @ApiOperation({
    summary: 'replace token',
    description:
      'access token이 만료되었을때 새로운 token을 발급하기 위한 API (refresh token 필요)',
  })
  @ApiOkResponse({
    description: 'access token, refresh token 발급',
    schema: {
      example: { accessToken: 'xxxx', refreshToken: 'xxxx' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'unauthorized (user invalid refresh token)',
  })
  @ApiForbiddenResponse({ description: 'invalid user info or token' })
  @ApiSecurity('refresh token')
  @UseGuards(JwtRefreshAuthGuard)
  refresh(@Req() req): Promise<JwtTokens> {
    return this.authService.refresh(req.user);
  }

  @Get('two-factor')
  @ApiOperation({
    summary: 'two-factor auth QR code',
    description:
      '2차 인증을 사용하기로 할 때, 사용자가 Secret Key를 저장할 수 있도록 QR Code 주소 반환 (Access Token 필요)',
  })
  @ApiOkResponse({
    description: 'QRCode Image src',
    schema: { example: { qrcode: 'url' } },
  })
  @ApiUnauthorizedResponse({
    description: 'unathurozied (invalid access token)',
  })
  @ApiSecurity('access token')
  @UseGuards(JwtAuthGuard)
  createTwoFactorAuthQRCode(@Req() req): Promise<QRCodeUrl> {
    return this.authService.createTwoFactorAuthQRCode(req.user);
  }

  @Post('two-factor')
  @ApiOperation({
    summary: 'two-factor auth verification',
    description:
      'Google Authenticator에서 생성한 6자리 코드를 받아와 검사 (42 api access token required)',
  })
  @ApiParam({
    type: 'string',
    name: 'token',
    description: 'two-factor authentication token',
    required: true,
  })
  @ApiOkResponse({
    description: 'login success',
    schema: {
      example: {
        accessToken: 'xxx',
        refreshToken: 'xxx',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'invalid token' })
  @ApiForbiddenResponse({ description: 'invalid user' })
  @UseGuards(FourtyTwoGuard)
  verifyTwoFactorAuth(
    @Req() req,
    @Body('token') token: string,
  ): Promise<JwtTokens> {
    const { id } = req.user;
    return this.authService.verifyTwoFactorAuth(id, token);
  }
}
