import { ApiProperty } from '@nestjs/swagger';
import { PongClient } from '../client/client.interface';
import { GameMode } from 'src/game/game.interface';

export class InvitationDto {
  @ApiProperty()
  from: PongClient;

  @ApiProperty()
  to: PongClient;

  @ApiProperty()
  mode: GameMode;

  @ApiProperty()
  roomId: string;
}
