import { Module, forwardRef } from '@nestjs/common';
import { EventGateway } from './events.gateway';
import { LobbyService } from './lobby/lobby.service';
import { ClientService } from './client/client.service';
import { QueueService } from './queue/queue.service';
import { UsersModule } from 'src/users/users.module';
import { GameModule } from 'src/game/game.module';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelsModule } from 'src/channels/channels.module';
import { EventChatModule } from 'src/channels/events.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => GameModule),
    AuthModule,
    ChannelsModule,
    // forwardRef(() => EventChatModule),
  ],
  providers: [EventGateway, LobbyService, ClientService, QueueService],
  exports: [ClientService],
})
export class EventsModule {}
