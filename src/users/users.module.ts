import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { HttpModule } from '@nestjs/axios';
import { FriendsService } from './friends/friends.service';
import { FriendsController } from './friends/friends.controller';
import { Friendship } from './friends/friendship.entity';
import { FriendsRepository } from './friends/friends.repository';
import { Achievement } from 'src/achievement/achievement.entity';
import { AchievementModule } from 'src/achievement/achievement.module';
import { Blockship } from './friends/blockship.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friendship, Achievement, Blockship]),
    HttpModule,
    AchievementModule,
  ],
  providers: [UsersService, FriendsService, FriendsRepository],
  controllers: [UsersController, FriendsController],
  exports: [UsersService, FriendsService],
})
export class UsersModule {}
