import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  private logger: Logger = new Logger('User Serivce');

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
  ) {}

  async setTwoFactorAuthenticationSecret(id: number, secret: string) {
    const updateResult = await this.userRepository.update(
      { id },
      { twoFactorSecret: secret },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return;
  }

  async setCurrentRefreshToken(refreshToken: string, id: number) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const updateResult = await this.userRepository.update(
      { id },
      { hashedRefreshToken },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return;
  }

  async getUserIfRefreshTokenValid(refreshToken: string, id: number) {
    const user = await this.getById(id);
    const isRefreshTokenMatch = bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (isRefreshTokenMatch) {
      return user;
    }
    return;
  }

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

  async removeRefreshToken(id: number): Promise<UpdateResult> {
    const updateResult = await this.userRepository.update(
      { id },
      { hashedRefreshToken: null },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return;
  }

  async signUp(createUserDto: CreateUserDto, id: number, avatarUrl: string) {
    const isInvalidRequest = await this.userRepository.find({
      where: [{ id }, { nickname: createUserDto.nickname }],
    });
    if (isInvalidRequest.length) {
      throw new BadRequestException();
    }

    const avatar = await this.getAvatarFromWeb(avatarUrl);
    const user = this.userRepository.create({
      id,
      nickname: createUserDto.nickname,
      avatar,
    });
    return await this.userRepository.save(user);
  }

  async turnOnTwoFactorAuthentication(id: number) {
    const updateResult = await this.userRepository.update(
      { id },
      { isTwoFactorAuthenticationEnabled: true },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return;
  }

  async turnOffTwoFactorAuthentication(id: number) {
    const updateResult = await this.userRepository.update(
      { id },
      { isTwoFactorAuthenticationEnabled: false, twoFactorSecret: null },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return;
  }

  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  async getUserAvatar(id: number): Promise<Uint8Array> {
    const user = await this.getById(id);
    return user.avatar;
  }

  async deleteUser(id: number) {
    const deleteResult = await this.userRepository.delete({ id });
    if (!deleteResult.affected) {
      throw new NotFoundException();
    }
    return;
  }

  async updateUserAvatar(id: number, data: Buffer) {
    const updateResult = await this.userRepository.update(
      { id },
      { avatar: data },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return;
  }
}
