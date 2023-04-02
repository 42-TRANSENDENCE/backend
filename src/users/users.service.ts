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
import {
  invalidAvatarUrlErr,
  nicknameExistErr,
  nicknameOrIdExistErr,
  userNotFoundErr,
} from './users.constants';
import * as bcrypt from 'bcrypt';
import { SearchUserDto } from './dto/search-user.dto';
import { FriendsService } from './friends/friends.service';

@Injectable()
export class UsersService {
  private logger: Logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly friendsService: FriendsService,
  ) {}

  async getByNickname(user: User, nickname: string): Promise<SearchUserDto> {
    const found = await this.userRepository.findOne({
      where: { nickname },
      relations: { achievements: true },
    });
    if (!found) {
      this.logger.error(`user: ${nickname} not exists`);
      throw new NotFoundException(userNotFoundErr);
    }
    const response: SearchUserDto = {
      id: found.id,
      nickname: found.nickname,
      avatar: found.avatar,
      achievement: found.achievements.map((achievement) => achievement.title),
      isFriend: await this.friendsService.isFriend(user, found),
    };
    return response;
  }

  async getUserAvatar(id: number): Promise<Uint8Array> {
    const user = await this.getById(id);
    return user.avatar;
  }

  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      this.logger.error(`user: ${id} not exists`);
      throw new NotFoundException(userNotFoundErr);
    }
    return user;
  }

  async updateUserAvatar(id: number, data: Buffer) {
    const updateResult = await this.userRepository.update(
      { id },
      { avatar: data },
    );
    if (!updateResult.affected) {
      this.logger.error(`user : ${id} update avatar failed`);
      throw new NotFoundException(userNotFoundErr);
    }
    return data;
  }

  async deleteUser(id: number) {
    const deleteResult = await this.userRepository.delete({ id });
    if (!deleteResult.affected) {
      this.logger.error(`user : ${id} delete user failed`);
      throw new NotFoundException(userNotFoundErr);
    }
    this.logger.log(`user: ${id} withdraw`);
    return;
  }

  async modifyNickname(user: User, nickname: string): Promise<User> {
    const isExist = await this.userRepository.findOneBy({ nickname });
    if (isExist) {
      throw new BadRequestException(nicknameExistErr);
    }
    user.nickname = nickname;
    return this.userRepository.save(user);
  }

  async setTwoFactorAuthenticationSecret(
    id: number,
    secret: string,
  ): Promise<void> {
    const updateResult = await this.userRepository.update(
      { id },
      { twoFactorSecret: secret },
    );
    if (!updateResult.affected) {
      this.logger.error(
        `set two factor authentication secret failed. id : ${id}`,
      );
      throw new NotFoundException(userNotFoundErr);
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
      this.logger.error(
        `user update failed refreshToken: ${refreshToken} id: ${id}`,
      );
      throw new NotFoundException(userNotFoundErr);
    }
    return;
  }

  async getUserIfValidRefreshToken(refreshToken: string, id: number) {
    const user = await this.getById(id);
    const isRefreshTokenMatch = bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!isRefreshTokenMatch) {
      this.logger.error(`Refresh Token is not valid. throws 401`);
      return null;
    }
    return user;
  }

  async removeRefreshToken(id: number): Promise<UpdateResult> {
    const updateResult = await this.userRepository.update(
      { id },
      { hashedRefreshToken: null },
    );
    if (!updateResult.affected) {
      this.logger.error(`user update failed id : ${id}`);
      throw new NotFoundException(userNotFoundErr);
    }
    return;
  }

  async create(id: number, nickname: string, avatarUrl: string): Promise<User> {
    const isExist = await this.userRepository.find({
      where: [{ id }, { nickname }],
    });
    if (isExist.length) {
      throw new BadRequestException(nicknameOrIdExistErr);
    }

    const avatar = await this.getAvatarFromWeb(avatarUrl);
    const user = this.userRepository.create({
      id,
      nickname,
      avatar,
      friends: [],
    });
    return this.userRepository.save(user);
  }

  async getAvatarFromWeb(url: string): Promise<Buffer> {
    const { data } = await firstValueFrom(
      this.httpService.get(url, { responseType: 'arraybuffer' }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw new NotFoundException(invalidAvatarUrlErr);
        }),
      ),
    );
    return data;
  }

  async turnOnTwoFactorAuthentication(id: number) {
    const updateResult = await this.userRepository.update(
      { id },
      { isTwoFactorAuthenticationEnabled: true },
    );
    if (!updateResult.affected) {
      this.logger.error(`user : ${id} turn on 2FA failed`);
      throw new NotFoundException(userNotFoundErr);
    }
    return;
  }

  async turnOffTwoFactorAuthentication(id: number) {
    const updateResult = await this.userRepository.update(
      { id },
      { isTwoFactorAuthenticationEnabled: false, twoFactorSecret: null },
    );
    if (!updateResult.affected) {
      this.logger.error(`user : ${id} turn off 2FA failed`);
      throw new NotFoundException(userNotFoundErr);
    }
    return;
  }
}
