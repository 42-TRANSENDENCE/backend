import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @Length(2, 12)
  @Matches(/^[a-z0-9_\-']+(\.[a-z0-9_\-']+)*$/)
  nickname: string;
}
