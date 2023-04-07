import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus, PongClient } from '../client/client.interface';
import { User } from 'src/users/users.entity';

export class FriendsStatusDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  status: ClientStatus;

  constructor(client: PongClient, user: User) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.status = client ? client.status : ClientStatus.OFFLINE;
  }
}
