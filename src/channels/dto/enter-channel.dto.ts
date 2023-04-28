import { ApiProperty } from '@nestjs/swagger';

export class EnterChannelDto {
  @ApiProperty({
    example: '1q2w3e4r',
    description: '비번방 입장하려고 치는 비밀번호',
  })
  password: string;
}
