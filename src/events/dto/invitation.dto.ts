import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from 'src/game/game.interface';
import { User } from 'src/users/users.entity';

export class InvitationDto {
  @ApiProperty()
  from: User;

  @ApiProperty()
  to: User;

  @ApiProperty()
  mode: GameMode;

  @ApiProperty()
  roomId: string;
}
