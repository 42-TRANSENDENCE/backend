import { ApiProperty } from '@nestjs/swagger';
import { Socket } from 'socket.io';
import { User } from 'src/users/users.entity';

export class PongClient {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user: User;

  @ApiProperty()
  room?: string;

  @ApiProperty()
  status: ClientStatus;

  constructor(client: Socket, user: User) {
    this.id = client.id;
    this.user = user;
    this.status = ClientStatus.ONLINE;
  }
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
