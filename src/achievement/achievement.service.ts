import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Achievement, Title } from './achievement.entity';
import { User } from 'src/users/users.entity';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async add(user: User, title: Title) {
    const achievement = await this.achievementRepository.findOneBy({
      title,
    });
    if (!achievement) {
      throw new NotFoundException('일치하는 업적을 찾을 수 없습니다.');
    }

    user.achievements.push(achievement);
    this.userRepository.save(user);
  }
}
