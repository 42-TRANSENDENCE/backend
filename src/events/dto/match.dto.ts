import { ApiProperty } from '@nestjs/swagger';
import { PongClient } from '../client/client.interface';
import { GameMode } from 'src/game/game.interface';

export class MatchDto {
  @ApiProperty()
  p1: PongClient;

  @ApiProperty()
  p2: PongClient;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  mode: GameMode;
}
