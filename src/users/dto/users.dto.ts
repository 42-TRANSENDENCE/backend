import { ApiProperty } from '@nestjs/swagger';
import { Length, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @Matches(`[a-z0-9_\.'\-]+`)
  @Matches(`\.{0, 1}`)
  @Length(2, 12)
  nickname: string;
}
