import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Chats } from 'src/channels/chats/chats.entity';
import { EventsModules } from '../events.module';
import { Channels } from 'src/channels/channels.entity';
import { ChannelsModule } from 'src/channels/channels.module';
import { ChannelMuteMember } from 'src/channels/channelmutemember.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Chats, User, Channels, ChannelMuteMember]),
    EventsModules,
    ChannelsModule,
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
