import { ApiProperty } from '@nestjs/swagger';
import { Title } from 'src/achievement/achievement.entity';
import { User } from '../users.entity';

export class UserResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  avatar: Uint8Array;

  @ApiProperty()
  isTwoFactorAuthenticationEnabled: boolean;

  @ApiProperty()
  achievements: Title[];

  @ApiProperty()
  wins: number;

  @ApiProperty()
  loses: number;

  constructor(user: User) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.avatar = user.avatar;
    this.isTwoFactorAuthenticationEnabled =
      user.isTwoFactorAuthenticationEnabled;
    this.achievements = user.achievements.map(
      (achievement) => achievement.title,
    );
    this.wins = user.wins.length;
    this.loses = user.loses.length;
  }
}
