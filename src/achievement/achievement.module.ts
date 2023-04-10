import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './achievement.entity';
import { AchievementSeed } from './achievement.seed';
import { AchievementService } from './achievement.service';
import { User } from 'src/users/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, User])],
  providers: [AchievementSeed, AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}
