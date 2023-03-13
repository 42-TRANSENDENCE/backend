import { HttpService } from '@nestjs/axios';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueWaiting,
  Process,
  Processor,
} from '@nestjs/bull';
import {
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { Job } from 'bull';
import { catchError, firstValueFrom } from 'rxjs';
import {
  FOURTY_TWO_TOKEN_URL,
  FOURTY_TWO_USER_INFO_URL,
} from '../auth.constants';
import { AuthService } from '../auth.service';
import { FourtyTwoToken } from '../interface/fourty-two-token.interface';

@Processor('fourtyTwoLogin')
export class LoginConsumer {
  private logger: Logger = new Logger(LoginConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.log(
      `job ${job.id} is completed. result : ${JSON.stringify(result)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.log(`job ${job.id} is failed. err: ${err.message}`);
  }

  @OnQueueWaiting()
  onWaiting(jobId: number | string) {
    this.logger.log(`job: ${jobId} is waiting on the queue`);
  }

  @Process('token')
  async getToken(job: Job<any>): Promise<FourtyTwoToken> {
    const { code } = job.data;
    const token = await this.getFourtyTwoToken(code);
    return token;
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
      this.httpService.post(FOURTY_TWO_TOKEN_URL, config).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw new UnauthorizedException('invalid 42 token or server is busy');
        }),
      ),
    );
    return data;
  }

  @Process('userInfo')
  async handleFourtyTwoAuth(job: Job<any>) {
    const { token } = job.data;
    if (!token) {
      throw new BadRequestException('token not exists');
    }

    const data = await this.getFourtyTwoUser(token.access_token);

    return data;
  }

  async getFourtyTwoUser(token: string) {
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
    return data;
  }
}
