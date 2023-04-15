import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChannelMember, MemberType } from '../channelmember.entity';
import { ChannelStatus } from '../channels.entity';

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
