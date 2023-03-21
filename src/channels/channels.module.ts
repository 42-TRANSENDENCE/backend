import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { Chats } from 'src/chats/chats.entity';
import { ChannelsGateway } from './events.chats.gateway';
import { ChannelBanMember } from './channelbanmember.entity';
import { ChannelMuteMember } from './channelmutemember.entity';
import { forwardRef } from '@nestjs/common';
import { EventsModule } from './events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channels,
      User,
      ChannelMember,
      ChannelBanMember,
      ChannelMuteMember,
      Chats,
    ]),
    forwardRef(() => EventsModule),
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService, ChannelsGateway],
})
export class ChannelsModule {}
