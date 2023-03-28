import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { HttpModule } from '@nestjs/axios';
import { FriendsService } from './friends/friends.service';
import { FriendsController } from './friends/friends.controller';
import { Friendship } from './friends/friendship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship]), HttpModule],
  providers: [UsersService, FriendsService],
  controllers: [UsersController, FriendsController],
  exports: [UsersService, FriendsService],
})
export class UsersModule {}
