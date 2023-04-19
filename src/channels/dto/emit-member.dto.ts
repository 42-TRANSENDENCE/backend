import { ApiProperty } from '@nestjs/swagger';

export class emitMemberDto {
  @ApiProperty()
  userId: number;
  constructor(userId: number) {
    this.userId = userId;
  }
}
