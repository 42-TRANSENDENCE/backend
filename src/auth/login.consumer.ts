import { HttpService } from '@nestjs/axios';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AuthService } from './auth.service';

@Processor('fourtyTwoLogin')
export class LoginConsumer {
  private logger: Logger = new Logger(LoginConsumer.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
  ) {}

  @Process('fourtyTwoLogin')
  async handleFourtyTwoAuth(job: Job<any>) {
    this.logger.debug(`login queue is processing job : ${job.id}`);

    const { token } = job.data;
    if (!token) {
      throw new BadRequestException('token not exists');
    }

    const data = await this.authService.getFourtyTwoUserInfo(token);

    this.logger.debug(`login queue is finished job : ${job.id}`);
    return data;
  }
}
