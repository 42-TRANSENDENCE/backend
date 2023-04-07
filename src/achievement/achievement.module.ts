import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './achievement.entity';
import { AchievementSeed } from './achievement.seed';
import { AchievementService } from './achievement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement])],
  providers: [AchievementSeed, AchievementService],
})
export class AchievementModule {}
