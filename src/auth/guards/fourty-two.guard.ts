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
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class FourtyTwoGuard implements CanActivate {
  private logger: Logger = new Logger(FourtyTwoGuard.name);

  constructor(
    private authService: AuthService,
    @InjectQueue('fourtyTwoLogin') private readonly loginQueue: Queue,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(request: Request) {
    const { code } = request.query;
    this.logger.debug(`code : ${code}`);

    let job = await this.loginQueue.add('token', {
      code,
    });

    try {
      const token = await job.finished();
      job = await this.loginQueue.add('userInfo', {
        token,
      });
      request.user = await job.finished();
      return true;
    } catch (err) {
      this.logger.error('42 Authorization failed');
      throw new UnauthorizedException('42 Authorization failed');
    }
  }
}
