import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from 'src/game/game.interface';

export class CreateFriendlyMatchDto {
  @ApiProperty()
  to: number;

  @ApiProperty()
  mode: GameMode;
}
