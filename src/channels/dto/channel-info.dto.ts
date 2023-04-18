import { ApiProperty } from '@nestjs/swagger';
import { ChannelStatus } from '../entity/channels.entity';
import { Channel } from '../entity/channels.entity';

export class ChannelIfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  owner: number;

  @ApiProperty()
  status: ChannelStatus;

  constructor(channel: Channel) {
    this.id = channel.id;
    this.title = channel.title;
    this.nickname = channel.owner.nickname;
    this.owner = channel.owner.id;
    this.status = channel.status;
  }
}
