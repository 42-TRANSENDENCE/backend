import { ApiProperty } from '@nestjs/swagger';
import { Title } from 'src/achievement/achievement.entity';

export class SearchUserDto {
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
}
