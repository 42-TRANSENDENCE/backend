import { InjectQueue } from '@nestjs/bull';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Queue } from 'bull';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { FourtyTwoToken } from '../interface/fourty-two-token.interface';

@Injectable()
export class FourtyTwoGuard implements CanActivate {
  private logger: Logger = new Logger(FourtyTwoGuard.name);

  constructor(
    private authService: AuthService,
    @InjectQueue('fourtyTwoLogin') private readonly loginQueue: Queue,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.token = await this.validateCode(request);
    return true;
  }

  async validateCode(request: Request): Promise<FourtyTwoToken> {
    const { code } = request.query;
    if (!code) {
      throw new UnauthorizedException('code not exists');
    }
    this.logger.debug(`code : ${code}`);

    const job = await this.loginQueue.add('token', {
      code,
    });

    try {
      const token = await job.finished();
      return token;
    } catch (err) {
      throw new UnauthorizedException('invalid code or server is busy');
    }
  }
}
