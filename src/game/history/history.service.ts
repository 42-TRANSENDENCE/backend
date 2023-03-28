import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../game.interface';
import { GameHistory } from './history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private readonly historyRepository: Repository<GameHistory>,
  ) {}

  createHistory(game: Game): GameHistory {
    let gameHistory: GameHistory;
    if (game.data.score.p1 > game.data.score.p2) {
      gameHistory = this.historyRepository.create({
        winner: game.players.p1.user,
        loser: game.players.p2.user,
        winnerScore: game.data.score.p1,
        loserScore: game.data.score.p2,
        endTime: new Date(),
      });
    } else {
      gameHistory = this.historyRepository.create({
        winner: game.players.p2.user,
        loser: game.players.p1.user,
        winnerScore: game.data.score.p2,
        loserScore: game.data.score.p1,
        endTime: new Date(),
      });
    }
    return gameHistory;
  }

  save(gameHistory: GameHistory): Promise<GameHistory> {
    return this.historyRepository.save(gameHistory);
  }
}
