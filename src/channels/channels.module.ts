import { CacheModule, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/channels/entity/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/entity/channelmember.entity';
// import { EventsModules } from './events.module';
import { forwardRef } from '@nestjs/common';
import { ChannelBanMember } from './entity/channelbanmember.entity';
import { ChatsModule } from './chats/chats.module';
import { AuthModule } from 'src/auth/auth.module';
import { Blockship } from 'src/users/friends/blockship.entity';
import { UsersModule } from 'src/users/users.module';
import { FriendsService } from 'src/users/friends/friends.service';
import { EventsModule } from 'src/events/events.module';
import { EventChatModule } from './events.module';
@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([
      Channel,
      User,
      ChannelMember,
      ChannelBanMember,
      Blockship,
    ]),
    forwardRef(() => ChatsModule),
    forwardRef(() => EventChatModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
