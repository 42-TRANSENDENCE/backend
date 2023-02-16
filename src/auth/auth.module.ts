import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { FourtyTwoStrategy } from './strategies/my-oauth2.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: 'oauth2' }),
  ],
  controllers: [AuthController],
  providers: [FourtyTwoStrategy, AuthService],
})
export class AuthModule {}
