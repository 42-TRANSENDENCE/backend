import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy } from 'passport-oauth2';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../auth.service';

@Injectable()
export class FourtyTwoStrategy extends PassportStrategy(Strategy, 'ft_OAuth2') {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private authService: AuthService,
    protected configService: ConfigService,
  ) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: configService.get<string>('CLIENT_ID'),
      clientSecret: configService.get<string>('CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/auth/callback',
    });
  }

  async validate(accessToken: string, refreshToken: string) {
    console.log(`${accessToken} / ${refreshToken}`);
    const { data } = await this.authService.getTokenInfo(accessToken);
    const { resource_owner_id } = data;
    const user = await this.userRepository.findBy({ id: resource_owner_id });
    return { accessToken, refreshToken, user };
  }
}
