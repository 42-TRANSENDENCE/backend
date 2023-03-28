import { Player } from './player/player.interface';

export enum GameMode {
  NORMAL = 'NORMAL',
  SPECIAL = 'SPECIAL',
}

export enum GameType {
  PRACTICE = 'PRACTICE',
  RANK = 'RANK',
}

export interface GameData {
  ballPos: { x: number; y: number };
  ballVel: { x: number; y: number };
  paddlePos: { p1: number; p2: number };
  score: { p1: number; p2: number };
  upPressed: { p1: boolean; p2: boolean };
  downPressed: { p1: boolean; p2: boolean };
}

export interface Game {
  gameId: string;
  intervalId: ReturnType<typeof setInterval> | null;
  isReady: { p1: boolean; p2: boolean };
  players: { p1: Player; p2: Player };
  spectators: Array<Player>;
  data: GameData;
  startTime: Date;
  endTime?: Date;
  type: GameType;
  mode: GameMode;
}

export interface GamePlayDto {
  roomId: string;
  keyCode: string;
}
