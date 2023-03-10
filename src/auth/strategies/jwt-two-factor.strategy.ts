import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { TokenPayload } from '../interface/token-payload.interface';

@Injectable()
export class JwtTwoFactorStrategy extends PassportStrategy(
  Strategy,
  'jwt-2fa',
) {
  private logger: Logger = new Logger(JwtTwoFactorStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.userService.getById(payload.id);

    if (!user.isTwoFactorAuthenticationEnabled) {
      this.logger.debug(`user ${user.nickname} does not using 2FA`);
      return user;
    }
    if (payload.isTwoFactorAuthenticationCompleted) {
      this.logger.debug(`user ${user.nickname} already done 2FA`);
      return user;
    }
    this.logger.debug(`user ${user.nickname} needs 2FA validation`);
  }
}
