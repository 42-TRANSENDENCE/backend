import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Chats } from 'src/chats/chats.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Chats, User])], // EventsMoudle
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
