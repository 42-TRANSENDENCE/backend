import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  getFourtyTwoUserInfo() {
    return 'this method request user info from 42 api server';
  }

  getUserInfo() {
    return 'this method reads user info from database';
  }

  updateUser() {
    return 'this method updates user info';
  }

  deleteUser() {
    return 'this method removes user info';
  }
}
