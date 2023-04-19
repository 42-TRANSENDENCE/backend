import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDmDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;
  //   constructor(id: string, nickname: string) {
  //     this.id = id;
  //     this.nickname = nickname;
  //   }
}
