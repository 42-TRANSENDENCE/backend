import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { FourtyTwoStrategy } from './strategies/my-oauth2.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';

@Module({
  imports: [
    UsersModule,
    HttpModule,
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'oauth2' }),
  ],
  controllers: [AuthController],
  providers: [
    FourtyTwoStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    AuthService,
  ],
})
export class AuthModule {}
