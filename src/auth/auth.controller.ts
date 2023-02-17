import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
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
    const { accessToken, refreshToken, user } = req.user;
    if (user) {
      console.log('User exist');
      // main page redirect
    } else {
      console.log("User doesn't exist");
      // sign up page redirect
    }
    return { accessToken, refreshToken, user };
  }
}
