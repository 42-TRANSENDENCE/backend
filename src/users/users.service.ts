import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
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
import { UserSearchDto } from './dto/user.search.response.dto';
import { FriendsService } from './friends/friends.service';
import { UserResponse } from './dto/user.response.dto';
import { Achievement, Title } from 'src/achievement/achievement.entity';
import { ChannelsService } from 'src/channels/channels.service';

@Injectable()
export class UsersService {
  private logger: Logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    private readonly friendsService: FriendsService,
    @Inject(forwardRef(() => ChannelsService))
    private ChannelsService: ChannelsService,
  ) {}

  async getUser(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { achievements: true, wins: true, loses: true },
    });
    if (!user) {
      throw new NotFoundException(userNotFoundErr);
    }
    return new UserResponse(user);
  }

  async getByNickname(user: User, nickname: string): Promise<UserSearchDto> {
    const found = await this.userRepository.findOne({
      where: { nickname },
      relations: { achievements: true, wins: true, loses: true },
    });
    if (!found) {
      this.logger.error(`user: ${nickname} not exists`);
      throw new NotFoundException(userNotFoundErr);
    }
    const response = new UserSearchDto(
      found,
      await this.friendsService.isFriend(user.id, found.id),
      await this.friendsService.isBlocked(user.id, found.id),
    );
    return response;
  }

  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      this.logger.error(`user: ${id} not exists`);
      throw new NotFoundException(userNotFoundErr);
    }
    return user;
  }

  async updateUserAvatar(user: User, data: Buffer) {
    user.avatar = data;
    this.userRepository.save(user);
    return data;
  }

  async deleteUser(user: User) {
    await this.ChannelsService.exitAlljoinedChannel(user);
    const deleteResult = await this.userRepository.delete(user.id);
    if (!deleteResult.affected) {
      this.logger.error(`user : ${user.id} delete user failed`);
      throw new NotFoundException(userNotFoundErr);
    }
    this.logger.log(`user: ${user.id} withdraw`);
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
    const firstLogin = await this.achievementRepository.findOneBy({
      title: Title.FIRST_LOGIN,
    });
    const user = this.userRepository.create({
      id,
      nickname,
      avatar,
      friends: [],
      achievements: [firstLogin],
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
}
