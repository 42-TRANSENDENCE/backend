import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { HistoryService } from './history/history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './history/history.entity';
import { EventsModule } from 'src/events/events.module';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/users.entity';
import { AchievementModule } from 'src/achievement/achievement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory, User]),
    EventsModule,
    UsersModule,
    AchievementModule,
  ],
  providers: [GameGateway, GameService, HistoryService],
  exports: [GameService],
})
export class GameModule {}
