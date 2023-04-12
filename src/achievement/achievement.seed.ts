import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, Title } from './achievement.entity';

@Injectable()
export class AchievementSeed implements OnApplicationBootstrap {
  private readonly logger: Logger = new Logger(AchievementSeed.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly repository: Repository<Achievement>,
  ) {}

  async onApplicationBootstrap() {
    const achievements: Achievement[] = await this.repository.find();
    const keys = Object.values(Title);

    keys.forEach((key) => {
      if (!achievements.find((achievement) => achievement.title === key)) {
        const toSave = this.repository.create({ title: key });
        this.repository.save(toSave);
        this.logger.log(`achievement title: ${toSave.title} saved`);
      }
    });
  }
}
