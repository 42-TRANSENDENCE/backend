import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class AuthSessionGuard implements CanActivate {
  private logger: Logger = new Logger(AuthSessionGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const session: any = request.session;
    if (!session.info) {
      throw new ForbiddenException('잘못된 접근입니다.');
    }
    request.sessionInfo = session.info;
    return true;
  }
}
