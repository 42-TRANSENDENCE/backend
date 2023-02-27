import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('signUp')
  signUp(@Body() createUserDto: CreateUserDto) {
    return 'user sign up';
  }

  @Get(':id')
  getUserInfo(@Param('id') id: number) {
    return 'user info';
  }

  @Delete(':id')
  deleteUser(@Param('id') id: number) {
    return 'delete result';
  }

  @Put(':id')
  updateUser(@Param('id') id: number) {
    return 'update user';
  }
}
