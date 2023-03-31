import { CacheModule, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { EventsModules } from './events.module';
import { Chats } from './chats/chats.entity';
import { forwardRef } from '@nestjs/common';
import { ChannelBanMember } from './channelbanmember.entity';
import { ChatsService } from './chats/chats.service';
import { ChatsModule } from './chats/chats.module';
import { ChannelsGateway } from './events.chats.gateway';
@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([Channels, User, ChannelMember, ChannelBanMember]),
    forwardRef(() => ChatsModule),
    forwardRef(() => EventsModules),
  ],
  providers: [ChannelsService, ChannelsGateway],
  controllers: [ChannelsController],
  exports: [ChannelsService, ChannelsGateway],
})
export class ChannelsModule {}
