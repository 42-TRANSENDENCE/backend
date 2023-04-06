import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, Title } from './achievement.entity';

@Injectable()
export class AchievementSeed implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Achievement)
    private readonly repository: Repository<Achievement>,
  ) {}

  async createIfNotExist(title: Title) {
    if (!(await this.repository.findOneBy({ title: title }))) {
      const achievement = this.repository.create({ title });
      this.repository.save(achievement);
    }
  }

  async onApplicationBootstrap() {
    const keys = Object.values(Title);
    keys.forEach((key) => this.createIfNotExist(key));
  }
}
