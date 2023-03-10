import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AuthService } from './auth.service';
import { fourtyTwoToken } from './interface/fourty-two-token.interface';

@Processor('fourtyTwoLogin')
export class LoginConsumer {
  private logger: Logger = new Logger(LoginConsumer.name);

  constructor(private readonly authService: AuthService) {}

  @Process('token')
  async getToken(job: Job<any>): Promise<fourtyTwoToken> {
    this.logger.debug(`login queue is processing token job : ${job.id}`);

    const { code } = job.data;
    const token = await this.authService.getFourtyTwoToken(code);

    this.logger.log(token);
    this.logger.debug(`login queue is finishing token job : ${job.id}`);
    return token;
  }

  @Process('userInfo')
  async handleFourtyTwoAuth(job: Job<any>) {
    this.logger.debug(`login queue is processing userInfo job : ${job.id}`);

    const { token } = job.data;
    if (!token) {
      throw new BadRequestException('token not exists');
    }

    const data = await this.authService.getFourtyTwoUserInfo(
      token.access_token,
    );

    this.logger.debug(`login queue is finishing userInfo job : ${job.id}`);
    return data;
  }
}
