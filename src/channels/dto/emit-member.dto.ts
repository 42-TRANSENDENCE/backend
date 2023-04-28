import { ApiProperty } from '@nestjs/swagger';

export class emitMemberDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  userId: number;

  constructor(userId: number, channelId: number) {
    this.userId = userId;
    this.channelId = channelId;
  }
}
