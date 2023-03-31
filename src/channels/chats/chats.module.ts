import { CacheModule, forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Chats } from 'src/channels/chats/chats.entity';
import { EventsModule } from 'src/channels/events.module';
import { Channels } from 'src/channels/channels.entity';
import { ChannelsModule } from 'src/channels/channels.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Chats, User, Channels]),
    EventsModule,
    forwardRef(() => ChannelsModule),
    CacheModule.register(),
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
