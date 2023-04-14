import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChatsDto {
  @IsNotEmpty()
  @Length(1, 100)
  @IsString()
  @ApiProperty({
    example: '채팅 문자열',
    description: '우리정글 뭐함?',
  })
  public content: string;
}
