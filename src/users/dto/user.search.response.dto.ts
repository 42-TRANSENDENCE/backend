import { ApiProperty } from '@nestjs/swagger';
import { Title } from 'src/achievement/achievement.entity';
import { User } from '../users.entity';

export class UserSearchDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  avatar: Uint8Array;

  @ApiProperty()
  achievement: Title[];

  @ApiProperty()
  isFriend: boolean;

  @ApiProperty()
  win: number;

  @ApiProperty()
  lose: number;

  constructor(user: User, isFriend: boolean) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.avatar = user.avatar;
    this.achievement = user.achievements.map(
      (achievement) => achievement.title,
    );
    this.isFriend = isFriend;
    this.win = user.wins.length;
    this.lose = user.loses.length;
  }
}
