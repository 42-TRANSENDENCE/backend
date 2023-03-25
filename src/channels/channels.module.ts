import { CacheModule, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { EventsModule } from 'src/channels/events/events.module';
import { forwardRef } from '@nestjs/common';
import { ChannelBanMember } from './channelbanmember.entity';
import { ChannelMuteMember } from './channelmutemember.entity';
import * as Redis from 'ioredis';
import { BullModule } from '@nestjs/bull';
import { ChatsService } from './chats/chats.service';
import { ChatsModule } from './chats/chats.module';
@Module({
  imports: [
      // BullModule.registerQueue({name:'channelRedis'}),
      CacheModule.register(),
      TypeOrmModule.forFeature([
      Channels, 
      User, 
      ChannelMember, 
      ChannelBanMember, 
      ChannelMuteMember,
    ]),
    forwardRef(() => ChatsModule),
  forwardRef(() => EventsModule)],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports:[ChannelsService]
})
export class ChannelsModule {}