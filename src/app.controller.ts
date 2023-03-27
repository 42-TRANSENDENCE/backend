import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('hello')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async hello(@Request() req) {
    return req.user;
  }
}
