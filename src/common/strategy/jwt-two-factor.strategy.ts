import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { JwtTokenPayload } from '../interface/jwt-token-payload.interface';

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

  async validate(payload: JwtTokenPayload) {
    const user = await this.userService.getById(payload.id);
    if (
      user.isTwoFactorAuthenticationEnabled &&
      !payload.isTwoFactorAuthenticationCompleted
    ) {
      throw new UnauthorizedException('2차 인증이 필요합니다.');
    }
    return user;
  }
}
