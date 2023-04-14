import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class leaveDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'room:1:socket',
    description: '채팅방에 연결된 소켓의 이름',
  })
  channelId: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 1,
    description:
      '채팅방에 연결된 소켓에 연결된 , 나갈 유저이름(클라이언트가 보내줌)',
  })
  userId: number;
}
