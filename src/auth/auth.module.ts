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
import { UsersModule } from 'src/users/users.module';
import { TwoFactorAuthController } from './two-factor-authentication/two-factor-auth.controller';
import { TwoFactorAuthService } from './two-factor-authentication/two-factor-auth.service';
import { JwtTwoFactorStrategy } from './strategies/jwt-two-factor.strategy';
import { BullModule } from '@nestjs/bull';
import { LoginConsumer } from './login.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'fourtyTwoLogin',
      limiter: { max: 2, duration: 1000, bounceBack: true },
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
    HttpModule,
    UsersModule,
  ],
  controllers: [AuthController, TwoFactorAuthController],
  providers: [
    FourtyTwoStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtTwoFactorStrategy,
    AuthService,
    TwoFactorAuthService,
    LoginConsumer,
  ],
  exports: [],
})
export class AuthModule {}
