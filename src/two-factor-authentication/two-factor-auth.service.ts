import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';

import * as speakeasy from 'speakeasy';

@Injectable()
export class TwoFactorAuthService {
  private logger: Logger = new Logger(TwoFactorAuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async register(user: User): Promise<speakeasy.GeneratedSecret> {
    const secret = speakeasy.generateSecret();

    user.twoFactorSecret = secret.ascii;
    await this.userRepository.save(user);

    return secret;
  }

  verifyTwoFactorAuth(secret: string, token: string): boolean {
    const isVerified = speakeasy.totp.verify({
      secret,
      encoding: 'ascii',
      token,
    });

    if (!isVerified) {
      this.logger.error(`2FA Failed token: ${token}`);
      throw new UnauthorizedException('2차 인증에 실패했습니다.');
    }
    return true;
  }

  async turnOnTwoFactorAuthentication(user: User): Promise<User> {
    user.isTwoFactorAuthenticationEnabled = true;
    await this.userRepository.save(user);
    return user;
  }

  async turnOffTwoFactorAuthentication(user: User): Promise<User> {
    user.isTwoFactorAuthenticationEnabled = false;
    await this.userRepository.save(user);
    return user;
  }
}
