import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChannelMember, MemberType } from '../channelmember.entity';
import { ChannelStatus } from '../channels.entity';
import { User } from 'src/users/users.entity';
import { Channel } from 'diagnostics_channel';
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
