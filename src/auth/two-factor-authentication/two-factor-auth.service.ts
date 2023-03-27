import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as speakeasy from 'speakeasy';

export interface QRCodeUrl {
  qrcode: string;
}

@Injectable()
export class TwoFactorAuthService {
  private logger: Logger = new Logger(TwoFactorAuthService.name);

  constructor(private readonly usersService: UsersService) {}

  async register(id: number) {
    const secret = speakeasy.generateSecret();
    await this.usersService.setTwoFactorAuthenticationSecret(id, secret.ascii);
    return secret;
  }

  verifyTwoFactorAuth(secret: string, token: string) {
    this.logger.log(`two factor token: ${token}`);

    const isVerified = speakeasy.totp.verify({
      secret,
      encoding: 'ascii',
      token,
    });

    if (!isVerified) {
      this.logger.error(`2FA Failed token: ${token}`);
      throw new UnauthorizedException('two factor authentication fail');
    }
    return true;
  }
}
