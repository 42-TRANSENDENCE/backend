import { ApiProperty } from '@nestjs/swagger';
import { ChannelStatus } from '../entity/channels.entity';
import { Channel } from '../entity/channels.entity';
import { ChannelMember, MemberType } from '../entity/channelmember.entity';
import { HowMany } from '../events.chats.gateway';
import { ChannelMemberDto } from './channel-member.dto';

export class ChannelTotalIfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  channelStatus: ChannelStatus;

  @ApiProperty()
  channelMembers: ChannelMemberDto[];

  @ApiProperty()
  howmany: HowMany;

  @ApiProperty()
  myType: MemberType;

  @ApiProperty()
  blockedArr: number[];

  constructor(
    channel: Channel,
    channelMembers: ChannelMemberDto[],
    howmany: HowMany,
    myType: MemberType,
    blockedArr: number[],
  ) {
    this.id = channel.id;
    this.title = channel.title;
    this.channelMembers = channelMembers;
    this.channelStatus = channel.status;
    this.howmany = howmany;
    this.myType = myType;
    this.blockedArr = blockedArr;
    // this.nickname = channel.owner.nickname;
    // this.owner = channel.owner.id;
  }
}
