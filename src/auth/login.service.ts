import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import {
  FOURTY_TWO_TOKEN_URL,
  FOURTY_TWO_USER_INFO_URL,
} from './auth.constants';
import { FourtyTwoToken } from './interface/fourty-two-token.interface';

@Injectable()
export class LoginService {
  private logger: Logger = new Logger(LoginService.name);
  private lastExecutedTime = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  delay = (ms) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(ms);
      }, ms),
    );
  };

  async oauthLogin(code: string) {
    let delayTime = 1000 - (Date.now() - this.lastExecutedTime);
    if (delayTime > 0) {
      await this.delay(delayTime);
      this.logger.debug(`waited for ${delayTime} ms`);
    }
    const token: FourtyTwoToken = await this.getFourtyTwoToken(code);
    this.logger.log(`access token: ${token.access_token}`);

    delayTime = 1000;
    await this.delay(delayTime);
    this.logger.debug(`waited for ${delayTime} ms`);
    return this.getFourtyTwoUserInfo(token.access_token);
  }

  private getFourtyTwoTokenRequestBody(code: string) {
    return {
      grant_type: 'authorization_code',
      client_id: this.configService.get<string>('CLIENT_ID'),
      client_secret: this.configService.get<string>('CLIENT_SECRET'),
      code,
      redirect_uri: this.configService.get<string>('REDIRECT_URI'),
    };
  }

  async getFourtyTwoToken(code: string): Promise<FourtyTwoToken> {
    const { data } = await firstValueFrom(
      this.httpService
        .post(FOURTY_TWO_TOKEN_URL, this.getFourtyTwoTokenRequestBody(code))
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw new UnauthorizedException(
              'invalid 42 token or server is busy',
            );
          }),
        ),
    );
    this.lastExecutedTime = Date.now();
    return data;
  }

  async getFourtyTwoUserInfo(token: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get(FOURTY_TWO_USER_INFO_URL, {
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
    this.lastExecutedTime = Date.now();
    return data;
  }
}
