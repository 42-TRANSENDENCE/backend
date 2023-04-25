import { ApiProperty } from '@nestjs/swagger';

export class SpectateDto {
  @ApiProperty()
  playerId : number;
}