import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Redirect,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/users.dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { FourtyTwoGuard } from './guards/fourty-two.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { AuthSessionGuard } from './guards/auth-session.guard';
import { SessionPayload } from './interface/session-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { FourtyTwoToken } from './interface/fourty-two-token.interface';
import { User } from './decorator/user.decorator';
import { SessionInfo } from './decorator/session-info.decorator';
import { Token } from './decorator/token.decorator';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private logger: Logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('login')
  @UseGuards(FourtyTwoGuard)
  @ApiOperation({
    summary: 'Log In',
    description:
      '로그인 성공시 home, 2차 인증 필요시 twofactor, 회원가입 필요시 signup으로 redirect',
  })
  @Redirect('')
  async login(@Req() req, @Token() token: FourtyTwoToken) {
    const fourtyTwoUser =
      await this.authService.getFourtyTwoUserInfoResultFromQueue(token);
    const accessCookie = this.authService.getCookieWithJwtAccessToken(
      fourtyTwoUser.id,
    );
    const { refreshToken, refreshCookie } =
      this.authService.getCookieWithJwtRefreshToken(fourtyTwoUser.id);

    this.logger.log(
      `accessCookie: ${accessCookie} / refreshCookie: ${refreshCookie}`,
    );
    const redirect_url = this.configService.get<string>('FRONTEND_URL');

    try {
      const user = await this.usersService.getById(fourtyTwoUser.id);
      this.usersService.setCurrentRefreshToken(refreshToken, user.id);
      req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
      if (!user.isTwoFactorAuthenticationEnabled) {
        this.logger.log(`user: ${user.id} logged in`);
        return { url: `${redirect_url}/home` };
      }
      this.logger.log(`user: ${user.id} 2FA Required`);
      return { url: `${redirect_url}/twofactor` };
    } catch (err) {
      const { id, image } = fourtyTwoUser;
      const { link } = image;
      req.session.info = { id, link }; // session
      return { url: `${redirect_url}/signup` };
    }
  }

  @Post('signup')
  @UseGuards(AuthSessionGuard)
  @ApiOperation({
    summary: '회원가입',
    description: '회원 가입 기능. avatar는 기본으로 42 이미지를 기반으로 생성',
  })
  @ApiCreatedResponse({ description: '회원가입 성공' })
  @ApiBadRequestResponse({ description: '이미 존재하는 닉네임입니다.' })
  @ApiForbiddenResponse({
    description: '잘못된 접근 / 로그인을 거치지 않고 온 경우',
  })
  @ApiBody({ type: CreateUserDto })
  async signUp(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Body() createUserDto: CreateUserDto,
    @SessionInfo() sessionInfo: SessionPayload,
  ) {
    const user = await this.usersService.create(
      sessionInfo.id,
      createUserDto.nickname,
      sessionInfo.link,
    );

    const accessCookie = this.authService.getCookieWithJwtAccessToken(user.id);
    const { refreshToken, refreshCookie } =
      this.authService.getCookieWithJwtRefreshToken(user.id);
    this.usersService.setCurrentRefreshToken(refreshToken, user.id);
    res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

    req.session.destroy(() =>
      this.logger.debug(`user id : ${user.id} session destroyed`),
    );
    this.logger.debug(`user id : ${user.id} signed up`);
    return user;
  }

  @Get('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOkResponse({
    description:
      'refresh token을 기반으로 새로운 access token을 cookie에 저장 기존 token이 만료되었을때 사용',
  })
  @ApiCookieAuth('Refresh')
  refresh(@Req() req, @User() user) {
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(
      user.id,
    );
    req.res.setHeader('Set-Cookie', accessTokenCookie);
    return;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: '로그아웃. cookie token 삭제' })
  @ApiCookieAuth('Authentication')
  async logOut(@Req() req, @User() user) {
    await this.usersService.removeRefreshToken(user.id);
    const cookie = await this.authService.getCookieForLogOut();
    req.res.setHeader('Set-Cookie', cookie);
    this.logger.log(`user ${user.id} logged out`);
    return;
  }
}
