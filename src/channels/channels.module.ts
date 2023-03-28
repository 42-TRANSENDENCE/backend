import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelcember.entity';
import { EventsModule } from 'src/events/events.module';
import { Chats } from 'src/chats/chats.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Channels, User, ChannelMember, Chats]),
    EventsModule,
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
