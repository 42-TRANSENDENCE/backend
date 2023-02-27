import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface QRCodeUrl {
  qrcode: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getTokens(id: number): Promise<JwtTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { id },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async login(id: number): Promise<JwtTokens> {
    console.log('user id', id);
    const userInfo = await this.userRepository.findOneBy({ id });
    if (userInfo) {
      if (userInfo.useAuth) {
        throw new UnauthorizedException(
          'two-factor authentication unauthorized',
        );
      }
      const tokens = await this.getTokens(id);
      // save refresh token to database
      this.userRepository.update({ id }, { refreshToken: tokens.refreshToken });
      // user exist issue JWT token (success)
      return tokens;
    }
    // user doesn't exist (sign up)
    throw new NotFoundException('user not exist');
  }

  async refresh(payload: any): Promise<JwtTokens> {
    const { id, refreshToken } = payload;
    const userInfo = await this.userRepository.findOneBy({ id });
    if (!userInfo || !userInfo.refreshToken) {
      throw new ForbiddenException('invalid user info');
    }
    if (userInfo.refreshToken !== refreshToken) {
      throw new ForbiddenException('invalid token');
    }
    const tokens = await this.getTokens(id);
    this.userRepository.update({ id }, { refreshToken: tokens.refreshToken });
    return tokens;
  }

  async createTwoFactorAuthQRCode(user): Promise<QRCodeUrl> {
    const { id } = user;
    const secret = speakeasy.generateSecret({ length: 20 });
    // TODO: secret hash?
    this.userRepository.update({ id }, { twoFactorSecret: secret.base32 });
    return { qrcode: await QRCode.toDataURL(secret.otpauth_url) };
  }

  async verifyTwoFactorAuth(id: number, token: string): Promise<JwtTokens> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user || !user.useAuth) {
      throw new ForbiddenException('invalid user');
    }
    const tokenValidates = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1,
    });
    if (tokenValidates) {
      const tokens = await this.getTokens(id);
      return tokens;
    }
    throw new UnauthorizedException('two factor authentication fail');
  }
}
