import { Injectable } from '@nestjs/common';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { Achievement, Title } from './achievement.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
  ) {}

}
