import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {}

  async getTokenInfo(accessToken: string) {
    return await firstValueFrom(
      this.httpService.get('https://api.intra.42.fr/oauth/token/info', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
  }
}
