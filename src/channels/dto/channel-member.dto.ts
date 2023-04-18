import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChannelMember, MemberType } from '../entity/channelmember.entity';
import { ChannelStatus } from '../entity/channels.entity';
export class ChannelMemberDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  channelId: number;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  type: MemberType;

  @ApiProperty()
  avatar: Uint8Array;

  constructor(member: ChannelMember) {
    this.userId = member.userId;
    this.channelId = member.channelId;
    this.nickname = member.user.nickname;
    this.type = member.type;
    this.avatar = member.user.avatar;
  }
}
