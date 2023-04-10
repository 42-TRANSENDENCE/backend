import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users.entity';

export class FriendResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;

  constructor(user: User) {
    this.id = user.id;
    this.nickname = user.nickname;
  }
}
