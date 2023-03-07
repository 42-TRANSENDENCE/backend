import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorToken {
  @ApiProperty()
  token: string;
}
