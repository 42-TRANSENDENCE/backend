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

  register(user: User): speakeasy.GeneratedSecret {
    const secret = speakeasy.generateSecret();

    user.twoFactorSecret = secret.ascii;
    this.userRepository.save(user);

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

  turnOnTwoFactorAuthentication(user: User): User {
    user.isTwoFactorAuthenticationEnabled = true;
    this.userRepository.save(user);
    return user;
  }

  turnOffTwoFactorAuthentication(user: User): User {
    user.isTwoFactorAuthenticationEnabled = false;
    this.userRepository.save(user);
    return user;
  }
}
