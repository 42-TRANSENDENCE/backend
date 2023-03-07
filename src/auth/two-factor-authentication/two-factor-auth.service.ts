import { Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface QRCodeUrl {
  qrcode: string;
}

@Injectable()
export class TwoFactorAuthService {
  constructor(private readonly usersService: UsersService) {}

  async generateTwoFactorAuthSecret(id: number) {
    const secret = speakeasy.generateSecret();
    await this.usersService.setTwoFactorAuthenticationSecret(id, secret.ascii);
    return secret.otpauth_url;
  }

  async pipeQRCodeStream(@Res() response, url: string) {
    return QRCode.toFileStream(response, url);
  }

  async verifyTwoFactorAuth(id: number, token: string) {
    const user = await this.usersService.getById(id);

    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'ascii',
      token,
    });

    if (!isVerified) {
      throw new UnauthorizedException('two factor authentication fail');
    }
  }
}
