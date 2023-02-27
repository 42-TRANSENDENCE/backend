import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { FourtyTwoStrategy } from './strategies/fourty-two.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    HttpModule,
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'oauth2' }),
  ],
  controllers: [AuthController],
  providers: [FourtyTwoStrategy, JwtStrategy, JwtRefreshStrategy, AuthService],
})
export class AuthModule {}
