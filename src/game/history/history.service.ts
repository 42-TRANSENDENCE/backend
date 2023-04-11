import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../game.interface';
import { GameHistory } from './history.entity';
import { User } from 'src/users/users.entity';
import { Title } from 'src/achievement/achievement.entity';
import { AchievementService } from 'src/achievement/achievement.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private readonly historyRepository: Repository<GameHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly achievementService: AchievementService,
  ) {}

  createHistory(game: Game): GameHistory {
    if (game.data.score.p1 > game.data.score.p2) {
      return this.historyRepository.create({
        winner: game.users.p1,
        loser: game.users.p2,
        winnerScore: game.data.score.p1,
        loserScore: game.data.score.p2,
        startTime: game.startTime,
        endTime: new Date(),
      });
    } else {
      return this.historyRepository.create({
        winner: game.users.p2,
        loser: game.users.p1,
        winnerScore: game.data.score.p2,
        loserScore: game.data.score.p1,
        startTime: game.startTime,
        endTime: new Date(),
      });
    }
  }

  async save(gameHistory: GameHistory): Promise<GameHistory> {
    const winner = await this.userRepository.findOne({
      where: { id: gameHistory.winner.id },
      relations: { achievements: true, wins: true },
    });

    const loser = await this.userRepository.findOne({
      where: { id: gameHistory.winner.id },
      relations: { achievements: true },
    });

    // FIRST_GAME
    if (
      !winner.achievements.find(
        (achievement) => achievement.title === Title.FIRST_GAME,
      )
    ) {
      this.achievementService.add(winner, Title.FIRST_GAME);
    }

    // WIN TEN GAMES
    if (winner.wins.length >= 10) {
      this.achievementService.add(winner, Title.WIN_TEN_GAMES);
    }

    // FIRST_GAME
    if (
      !loser.achievements.find(
        (achievement) => achievement.title === Title.FIRST_GAME,
      )
    ) {
      this.achievementService.add(loser, Title.FIRST_GAME);
    }

    return this.historyRepository.save(gameHistory);
  }
}
