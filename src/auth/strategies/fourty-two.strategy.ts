import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from '../auth.service';

@Injectable()
export class FourtyTwoStrategy extends PassportStrategy(
  Strategy,
  'fourty-two',
) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(token: string) {
    return this.authService.getFourtyTwoUserInfo(token);
  }
}
