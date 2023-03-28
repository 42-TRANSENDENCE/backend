import { GameMode } from '../game.interface';
import { Player } from '../player/player.interface';

export interface CreateFriendlyMatchDto {
  to: number;
  mode: GameMode;
}

export interface InvitationDto {
  from: Player;
  to: Player;
  mode: GameMode;
  roomId: string;
}

export interface MatchDto {
  p1: Player;
  p2: Player;
  roomId: string;
  mode: GameMode;
}

export interface QueueDto {
  mode: GameMode;
}
