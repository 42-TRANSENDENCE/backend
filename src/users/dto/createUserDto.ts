import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty()
  @IsString()
  @Length(2, 12)
  @Matches(`/[\w-.']+/`)
  nickname: string;

  @ApiProperty()
  @IsOptional()
  avatar: string;
}
