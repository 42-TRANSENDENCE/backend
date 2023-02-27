import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AxiosError } from 'axios';
import { Strategy } from 'passport-http-bearer';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class FourtyTwoStrategy extends PassportStrategy(
  Strategy,
  'fourty-two',
) {
  private readonly logger = new Logger('Strategy');

  constructor(private httpService: HttpService) {
    super();
  }

  async validate(token: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get('https://api.intra.42.fr/v2/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw new UnauthorizedException('invalid 42 token');
          }),
        ),
    );
    return data;
  }
}
