import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from 'src/users/users.module';
import { TwoFactorAuthController } from './two-factor-authentication/two-factor-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtTwoFactorStrategy } from './strategies/jwt-two-factor.strategy';
import { TwoFactorAuthService } from './two-factor-authentication/two-factor-auth.service';
import { LoginService } from './login.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
    HttpModule.register({
      timeout: 2000,
    }),
    UsersModule,
  ],
  controllers: [AuthController, TwoFactorAuthController],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    JwtTwoFactorStrategy,
    AuthService,
    TwoFactorAuthService,
    LoginService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
