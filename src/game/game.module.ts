import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { LobbyService } from './lobby/lobby.service';
import { PlayerService } from './player/player.service';
import { QueueService } from './queue/queue.service';
import { HistoryService } from './history/history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './history/history.entity';

@Module({
  imports: [UsersModule, AuthModule, TypeOrmModule.forFeature([GameHistory])],
  providers: [
    GameGateway,
    LobbyService,
    GameService,
    PlayerService,
    QueueService,
    HistoryService,
  ],
})
export class GameModule {}
