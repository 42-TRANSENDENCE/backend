import { HttpService } from '@nestjs/axios';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserInfo(accessToken: string) {
    const { data } = await firstValueFrom(
      this.httpService.get('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return data;
  }

  async getTokens(id: number) {
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

  async login(token: { accessToken: string; refreshToken: string }) {
    const { id } = await this.getUserInfo(token.accessToken);
    console.log('user id', id);
    const userInfo = await this.userRepository.findOneBy({ id });
    if (userInfo) {
      if (userInfo.useAuth) {
        // redirect to two factor authentication
        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          useAuth: true,
          id,
        };
      }
      const tokens = await this.getTokens(id);
      // save refresh token to database
      await this.userRepository.update(
        { id },
        { refreshToken: tokens.refreshToken },
      );
      // user exist
      return {
        jwtAccessToken: tokens.accessToken,
        jwtRefreshToken: tokens.refreshToken,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
    }
    // user doesn't exist
    return {
      id,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }

  async refresh(payload: any) {
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

  async createTwoFactorAuth(id: number): Promise<string> {
    const secret = speakeasy.generateSecret({ length: 20 });
    await this.userRepository.update(
      { id },
      { twoFactorSecret: secret.base32 },
    );
    return await QRCode.toDataURL(secret.otpauth_url);
  }

  async verifyTwoFactorAuth(id: number, token: string) {
    const user = await this.userRepository.findOneBy({ id });
    const tokenValidates = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1,
    });
    if (tokenValidates) {
      const tokens = await this.getTokens(id);
      return {
        jwtAccessToken: tokens.accessToken,
        jwtRefreshToken: tokens.refreshToken,
      };
    }
    throw new UnauthorizedException('two factor authentication fail');
  }
}
