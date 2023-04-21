import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChannelMember, MemberType } from '../entity/channelmember.entity';
import { ChannelStatus } from '../entity/channels.entity';

export interface HowMany {
  connectedSocket: number;
  joinMember: number;
}

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

  // @ApiProperty()
  // howMany: HowMany;

  @ApiProperty()
  updatedAt: Date;

  constructor(channel) {
    this.id = channel.id;
    this.title = channel.title;
    this.owner = channel.owner;
    this.status = channel.status;
    this.createdAt = channel.createdAt;
    this.updatedAt = channel.updatedAt;
    // this.howMany = HowMany;
  }
}
