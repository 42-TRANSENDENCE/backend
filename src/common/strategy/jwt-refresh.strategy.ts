import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { JwtTokenPayload } from '../../auth/interface/jwt-token-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private logger: Logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private configService: ConfigService,
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Refresh;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtTokenPayload) {
    const refreshToken = req.cookies?.Refresh;
    this.logger.debug(`refresh token : ${refreshToken}`);
    const user = await this.userService.getUserIfValidRefreshToken(
      refreshToken,
      payload.id,
    );
    if (!user) {
      throw new UnauthorizedException('올바르지 않은 refesh token입니다.');
    }
    return user;
  }
}
