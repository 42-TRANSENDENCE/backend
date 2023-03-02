import { Module } from '@nestjs/common';
import { FourtyTwoStrategy } from './strategies/fourty-two.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { HttpModule } from '@nestjs/axios';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [
    FourtyTwoStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    AuthService,
    UsersService,
  ],
  exports: [FourtyTwoStrategy, JwtStrategy, AuthService],
})
export class AuthModule {}
