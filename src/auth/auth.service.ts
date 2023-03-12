import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { FOURTY_TWO_TOKEN_URI, FOURTY_TWO_USER_INFO } from './auth.constants';
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
    private readonly httpService: HttpService,
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
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )}`;
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

  async getFourtyTwoUserInfoResultFromQueue(token: FourtyTwoToken) {
    const job = await this.loginQueue.add('userInfo', { token });
    try {
      return await job.finished();
    } catch (err) {
      this.logger.error('42 Authorization failed');
      throw new UnauthorizedException('42 Authorization failed');
    }
  }

  async getFourtyTwoUserInfo(token: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get(FOURTY_TWO_USER_INFO, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw new UnauthorizedException(
              'invalid 42 token or server is busy',
            );
          }),
        ),
    );
    return data;
  }

  async getFourtyTwoToken(code: string) {
    const config = {
      grant_type: 'authorization_code',
      client_id: this.configService.get<string>('CLIENT_ID'),
      client_secret: this.configService.get<string>('CLIENT_SECRET'),
      code,
      redirect_uri: this.configService.get<string>('REDIRECT_URI'),
    };

    const { data } = await firstValueFrom(
      this.httpService.post(FOURTY_TWO_TOKEN_URI, config).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw new UnauthorizedException('invalid 42 token or server is busy');
        }),
      ),
    );
    return data;
  }
}
