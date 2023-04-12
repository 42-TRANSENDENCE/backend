import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateChannelDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '수다방',
    description: '채팅방 이름',
  })
  public title: string;

  @ApiProperty({
    example: '1q2w3e4r',
    description: '비밀번호',
  })
  public password: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: '채팅방 소유자, 처음 생성자',
  })
  public owner: number;

  // @ApiProperty({
  //   example: true,
  //   description: '채팅방 비번 유무',
  // })
  // public private: boolean;
}
