import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class EnterChannelDto {
  @IsString()
  @Matches(/^[a-z0-9_\-']+(\.[a-z0-9_\-']+)*$/)
  @ApiProperty({
    example: '1q2w3e4r',
    description: '비번방 입장하려고 치는 비밀번호',
  })
  password: string;
}
