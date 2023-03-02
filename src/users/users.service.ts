import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AuthService, JwtTokens } from 'src/auth/auth.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/users.dto';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  private logger: Logger = new Logger('User Serivce');

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
  ) {}

  async getAvatarFromWeb(url: string): Promise<Buffer> {
    const { data } = await firstValueFrom(
      this.httpService.get(url, { responseType: 'arraybuffer' }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw new NotFoundException('invalid avatar url');
        }),
      ),
    );
    return data;
  }

  async signUp(
    createUserDto: CreateUserDto,
    id: number,
    avatarUrl: string,
  ): Promise<JwtTokens> {
    const isExist = await this.userRepository.findOneBy({
      nickname: createUserDto.nickname,
    });
    if (isExist) {
      throw new ConflictException('invalid nickname');
    }

    const avatar = await this.getAvatarFromWeb(avatarUrl);
    const tokens = await this.authService.getTokens(id);

    const user = this.userRepository.create({
      id,
      nickname: createUserDto.nickname,
      avatar,
      refreshToken: tokens.refreshToken,
    });
    this.userRepository.save(user);
    console.log(user);
    return tokens;
  }

  async getUserAvatar(id: number): Promise<Uint8Array> {
    const user = await this.userRepository.findOneBy({ id });
    return user.avatar;
  }

  async getUserInfo(id: number): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  async getFourtyTwoUserInfo(token: string) {
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

  async deleteUser(id: number) {
    return this.userRepository.delete({ id });
  }

  async updateUserAvatar(id: number, data: Buffer) {
    const user = await this.userRepository.findOneBy({ id });
    user.avatar = data;
    return this.userRepository.save(user);
  }
}
