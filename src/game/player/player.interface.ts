import { User } from 'src/users/users.entity';

export interface Player {
  id: string;
  user: User;
  room?: string;
  status: PlayerStatus;
}

export enum PlayerStatus {
  WAITING = 'WAITING',
  INGAME = 'INGAME',
}
