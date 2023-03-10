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
import { RequestWithSession } from './interface/request-with-session.interface';
import { SessionPayload } from './interface/session-payload.interface';
import { ConfigService } from '@nestjs/config';

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
  async login(@Req() req) {
    const { id } = req.user;

    const accessCookie = this.authService.getCookieWithJwtAccessToken(id);
    const { refreshToken, refreshCookie } =
      this.authService.getCookieWithJwtRefreshToken(id);

    this.logger.log(
      `accessCookie: ${accessCookie} / refreshCookie: ${refreshCookie}`,
    );
    const redirect_url = this.configService.get<string>('FRONTEND_URL');

    try {
      const user = await this.usersService.getById(id);
      this.usersService.setCurrentRefreshToken(refreshToken, id);
      req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
      if (!user.isTwoFactorAuthenticationEnabled) {
        return { url: `${redirect_url}/home` };
      }
      return { url: `${redirect_url}/twofactor` };
    } catch (err) {
      const { id, image } = req.user;
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
    @Req() req: RequestWithSession,
    @Body() createUserDto: CreateUserDto,
  ) {
    console.log(req.info);
    const payload: SessionPayload = req.info;

    const user = await this.usersService.signUp(
      createUserDto,
      payload.id,
      payload.link,
    );

    req.session.destroy(() =>
      this.logger.debug(`user id : ${user.id} sign up. session destroyed`),
    );
    const accessCookie = this.authService.getCookieWithJwtAccessToken(user.id);
    const { refreshToken, refreshCookie } =
      this.authService.getCookieWithJwtRefreshToken(user.id);
    this.usersService.setCurrentRefreshToken(refreshToken, user.id);
    req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
    return user;
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
    this.logger.log(`user ${id} logged out`);
    await this.usersService.removeRefreshToken(id);
    const cookie = await this.authService.getCookieForLogOut();
    req.res.setHeader('Set-Cookie', cookie);
  }
}
