import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  Post,
  Redirect,
  Req,
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
import { AuthSessionGuard } from '../common/guard/auth-session.guard';
import { SessionPayload } from './interface/session-payload.interface';
import { ConfigService } from '@nestjs/config';
import { SessionInfo } from './decorator/session-info.decorator';
import { Code } from './decorator/code.decorator';
import { LoginService } from './login.service';
import { GetUser } from '../common/decorator/user.decorator';
import { JwtRefreshAuthGuard } from 'src/common/guard/jwt-refresh-auth.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private logger: Logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly loginService: LoginService,
  ) {}

  @Get('login')
  @ApiOperation({
    summary: 'Log In',
    description:
      '로그인 성공시 home, 2차 인증 필요시 twofactor, 회원가입 필요시 signup으로 redirect',
  })
  @Redirect('')
  async login(@Req() req, @Code() code) {
    if (!code) {
      throw new ForbiddenException('잘못된 접근입니다.');
    }
    const fourtyTwoUserInfo = await this.loginService.oauthLogin(code);
    this.logger.log(
      `42 User id: ${fourtyTwoUserInfo.id}, intra name: ${fourtyTwoUserInfo.login}`,
    );
    const accessCookie = this.authService.getCookieWithJwtAccessToken(
      fourtyTwoUserInfo.id,
    );
    const { refreshToken, refreshCookie } =
      this.authService.getCookieWithJwtRefreshToken(fourtyTwoUserInfo.id);

    const redirect_url = this.configService.get<string>('FRONTEND_URL');
    try {
      const user = await this.usersService.getById(fourtyTwoUserInfo.id);
      this.usersService.setCurrentRefreshToken(refreshToken, user.id);
      req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
      if (!user.isTwoFactorAuthenticationEnabled) {
        this.logger.log(`user: ${user.id} logged in`);
        return { url: `${redirect_url}/socket` };
      }
      this.logger.log(`user: ${user.id} 2FA Required`);
      return { url: `${redirect_url}/twofactor` };
    } catch (err) {
      this.logger.log(`needs sign up`);
      const { id, image } = fourtyTwoUserInfo;
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
    req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

    req.session.destroy(() =>
      this.logger.debug(`user id : ${user.id} session destroyed`),
    );
    this.logger.log(`user id : ${user.id} signed up`);
    return user;
  }

  @Get('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOkResponse({
    description:
      'refresh token을 기반으로 새로운 access token을 cookie에 저장 기존 token이 만료되었을때 사용',
  })
  @ApiCookieAuth('Refresh')
  refresh(@Req() req, @GetUser() user) {
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
  async logOut(@Req() req, @GetUser() user) {
    await this.usersService.removeRefreshToken(user.id);
    const cookie = await this.authService.getCookieForLogOut();
    req.res.setHeader('Set-Cookie', cookie);
    this.logger.log(`user ${user.id} logged out`);
    return;
  }
}
