import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, Length } from 'class-validator';

export class TwoFactorTokenDto {
  @ApiProperty()
  @Length(6, 6)
  @IsNumberString()
  token: string;
}
