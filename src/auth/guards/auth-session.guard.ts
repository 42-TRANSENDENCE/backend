import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestWithSession } from '../interface/request-with-session.interface';

@Injectable()
export class AuthSessionGuard implements CanActivate {
  private logger: Logger = new Logger(AuthSessionGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: RequestWithSession = context.switchToHttp().getRequest();
    const session: any = request.session;

    if (!session.info) {
      throw new ForbiddenException('잘못된 접근입니다.');
    }
    request.info = session.info;
    return true;
  }
}
