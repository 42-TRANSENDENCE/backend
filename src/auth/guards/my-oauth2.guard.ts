import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FourtyTwoGuard extends AuthGuard('ft_OAuth2') {}
