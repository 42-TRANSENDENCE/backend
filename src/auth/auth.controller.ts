import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh-auth.guard';
import { FourtyTwoGuard } from './guards/my-oauth2.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @UseGuards(FourtyTwoGuard)
  login(): void {
    return;
  }

  @Get('callback')
  @UseGuards(FourtyTwoGuard)
  async callback(@Req() req) {
    return this.authService.login(req.user);
  }

  @Get('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req) {
    return this.authService.refresh(req.user);
  }

  @Post('two-factor')
  async verifyTwoFactorAuth(
    @Body('id', ParseIntPipe) id: number,
    @Body('token') token: string,
  ) {
    return this.authService.verifyTwoFactorAuth(id, token);
  }

  @Get('two-factor/:id')
  async createTwoFactorAuthQRCode(@Param('id', ParseIntPipe) id: number) {
    return this.authService.createTwoFactorAuth(id);
  }
}
