import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from '../../game/game.interface';

export class QueueDto {
  @ApiProperty()
  mode: GameMode;
}
