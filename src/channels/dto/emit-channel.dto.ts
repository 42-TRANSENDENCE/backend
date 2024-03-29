import { ApiProperty } from '@nestjs/swagger';
import { ChannelStatus } from '../entity/channels.entity';

export class EmitChannelInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  owner: number;

  @ApiProperty()
  status: ChannelStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(channel) {
    this.id = channel.id;
    this.title = channel.title;
    this.owner = channel.owner;
    this.status = channel.status;
    this.createdAt = channel.createdAt;
    this.updatedAt = channel.updatedAt;
  }
}
