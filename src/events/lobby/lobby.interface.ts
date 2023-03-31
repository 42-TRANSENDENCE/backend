import { GameMode } from '../../game/game.interface';
import { PongClient } from '../client/client.interface';

export interface CreateFriendlyMatchDto {
  to: number;
  mode: GameMode;
}

export interface InvitationDto {
  from: PongClient;
  to: PongClient;
  mode: GameMode;
  roomId: string;
}

export interface MatchDto {
  p1: PongClient;
  p2: PongClient;
  roomId: string;
  mode: GameMode;
}

export interface QueueDto {
  mode: GameMode;
}
