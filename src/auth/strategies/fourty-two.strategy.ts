import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FourtyTwoStrategy extends PassportStrategy(
  Strategy,
  'fourty-two',
) {
  private readonly logger = new Logger('Strategy');

  constructor(private userService: UsersService) {
    super();
  }

  async validate(token: string) {
    return await this.userService.getFourtyTwoUserInfo(token);
  }
}
