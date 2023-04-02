import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Chats } from 'src/chats/chats.entity';
import { Channels } from 'src/channels/channels.entity';
import { ChannelsModule } from 'src/channels/channels.module';
@Module({
  imports: [ChannelsModule, TypeOrmModule.forFeature([Chats, User, Channels])],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
