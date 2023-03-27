import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { JwtTokenPayload } from './interface/jwt-token-payload.interface';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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

  async getUserFromAuthenticationToken(token: string) {
    const payload: JwtTokenPayload = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
    if (payload.id) {
      return this.usersService.getById(payload.id);
    }
  }
}
