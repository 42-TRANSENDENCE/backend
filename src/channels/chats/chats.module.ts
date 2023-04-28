import { CacheModule, forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Chat } from 'src/channels/chats/chats.entity';
import { Channel } from 'src/channels/entity/channels.entity';
import { ChannelsModule } from 'src/channels/channels.module';
import { ChannelMember } from '../entity/channelmember.entity';
import { UsersModule } from 'src/users/users.module';
import { EventChatModule } from '../events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User, Channel, ChannelMember]),
    EventChatModule,
    forwardRef(() => ChannelsModule),
    CacheModule.register(),
    forwardRef(() => UsersModule),
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
