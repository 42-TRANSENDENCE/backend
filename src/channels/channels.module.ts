import { CacheModule, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { EventsModules } from './events.module';
import { forwardRef } from '@nestjs/common';
import { ChannelBanMember } from './channelbanmember.entity';
import { ChatsModule } from './chats/chats.module';
@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([Channel, User, ChannelMember, ChannelBanMember]),
    forwardRef(() => ChatsModule),
    forwardRef(() => EventsModules),
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
