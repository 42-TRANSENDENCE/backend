import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Chats } from 'src/chats/chats.entity';
import { Channels } from 'src/channels/channels.entity';
<<<<<<< HEAD
import { ChannelsModule } from 'src/channels/channels.module';
@Module({
  imports: [ChannelsModule, TypeOrmModule.forFeature([Chats, User, Channels])],
=======
import { ChannelMuteMember } from 'src/channels/channelmutemember.entity';
import { ChannelsModule } from 'src/channels/channels.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Chats, User, Channels, ChannelMuteMember]),
    EventsModule,
    ChannelsModule,
  ],
>>>>>>> cc020b2 (Feat : channel Service 의 함수를 Chat Service에서 쓰기#72)
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
