import { CacheModule, forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from 'src/channels/chats/chats.entity';
import { ChannelsModule } from 'src/channels/channels.module';
import { UsersModule } from 'src/users/users.module';
import { EventChatModule } from '../events.module';
import { ChatsRepository } from './chats.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    EventChatModule,
    forwardRef(() => ChannelsModule),
    CacheModule.register(),
    forwardRef(() => UsersModule),
  ],
  providers: [ChatsService, ChatsRepository],
  controllers: [ChatsController],
})
export class ChatsModule {}
