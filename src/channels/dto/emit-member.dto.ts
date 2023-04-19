import { ApiProperty } from '@nestjs/swagger';

export class emitMemberDto {
  @ApiProperty()
  id: number;
  constructor(userId: number) {
    this.id = userId;
  }
}
