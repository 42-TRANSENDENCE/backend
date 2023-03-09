import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Queue } from 'bull';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from '../auth.service';

@Injectable()
export class FourtyTwoStrategy extends PassportStrategy(
  Strategy,
  'fourty-two',
) {
  private logger: Logger = new Logger(FourtyTwoStrategy.name);

  constructor(
    private authService: AuthService,
    @InjectQueue('fourtyTwoLogin') private readonly loginQueue: Queue,
  ) {
    super();
  }

  async validate(token: string) {
    const job = await this.loginQueue.add('fourtyTwoLogin', {
      token,
    });

    this.logger.debug(`job ${job.id} added`);

    try {
      const data = await job.finished();
      this.logger.debug(`job ${job.id} is finished`);
      return data;
    } catch (err) {
      this.logger.error('invalid 42 token is provided');
      throw new UnauthorizedException('42 token is invalid or server is busy');
    }
  }
}
