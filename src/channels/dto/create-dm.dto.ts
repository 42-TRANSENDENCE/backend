import { ApiProperty } from '@nestjs/swagger';

export class CreateDmDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;
}
