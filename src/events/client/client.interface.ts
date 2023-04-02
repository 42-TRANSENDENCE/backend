import { User } from 'src/users/users.entity';

export interface PongClient {
  id: string;
  user: User;
  room?: string;
  status: ClientStatus;
}

export enum ClientStatus {
  ONLINE = 'ONLINE',
  INGAME = 'INGAME',
  OFFLINE = 'OFFLINE',
}

export interface ChangeStatusDto {
  userId: number;
  status: ClientStatus;
}
