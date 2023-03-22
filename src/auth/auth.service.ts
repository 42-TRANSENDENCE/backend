import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenPayload } from './interface/jwt-token-payload.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FourtyTwoToken } from './interface/fourty-two-token.interface';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);

  constructor(
    @InjectQueue('fourtyTwoLogin')
    private readonly loginQueue: Queue,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getCookieWithJwtAccessToken(
    id: number,
    isTwoFactorAuthenticationCompleted = false,
  ) {
    const payload: JwtTokenPayload = { id, isTwoFactorAuthenticationCompleted };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });
    const accessCookie = `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )}`;
    this.logger.log(`user ${id} access token cookie: ${accessCookie}`);
    return accessCookie;
  }

  getCookieWithJwtRefreshToken(id: number) {
    const payload: JwtTokenPayload = { id };
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });
    const refreshCookie = `Refresh=${refreshToken}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    )}`;
    this.logger.log(`user ${id} refresh token cookie: ${refreshCookie}`);
    return {
      refreshCookie,
      refreshToken,
    };
  }

  getCookieForLogOut() {
    return [
      `Authentication=; HttpOnly; Path=/; Max-Age=0`,
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ];
  }

  async getFourtyTwoUser(token: FourtyTwoToken) {
    const job = await this.loginQueue.add('userInfo', { token });
    try {
      return await job.finished();
    } catch (err) {
      this.logger.error('42 Authorization failed');
      throw new UnauthorizedException('42 Authorization failed');
    }
  }
}
