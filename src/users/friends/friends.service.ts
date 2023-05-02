import {
  BadRequestException,
  ClassSerializerInterceptor,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UseInterceptors,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import {
  friendshipNotFoundErr,
  isExistRequestErr,
  requestNotFoundErr,
} from './friends.constants';
import { Friendship, FriendStatus } from './friendship.entity';
import { userNotFoundErr } from '../users.constants';
import { FriendsRepository } from './friends.repository';
import { AchievementService } from 'src/achievement/achievement.service';
import { Title } from 'src/achievement/achievement.entity';
import { Blockship } from './blockship.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { FriendsBlocksRepository } from './friends.blocks.repository';

@Injectable()
@UseInterceptors(ClassSerializerInterceptor)
export class FriendsService {
  private logger: Logger = new Logger(FriendsService.name);

  constructor(
    private readonly friendsRepository: FriendsRepository,
    private readonly friendsBlockRepository: FriendsBlocksRepository,
    @Inject(forwardRef(() => ChannelsService))
    private ChannelsService: ChannelsService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly achievementService: AchievementService,
  ) {}

  async getAllFriends(user: User): Promise<User[]> {
    if (!user) throw new NotFoundException(userNotFoundErr);
    const friendships = await this.friendsRepository.findApproved(user.id);
    const friends: User[] = friendships.map((friendship) => {
      if (friendship.user.id === user.id) {
        return friendship.otherUser;
      }
      return friendship.user;
    });
    this.logger.debug(`${user.nickname}'s friend: ${friends.length}`);
    return friends;
  }

  async getAllDoBlocks(user: User): Promise<User[]> {
    const blockships = await this.friendsBlockRepository.findBlockByIdWithUser(
      user.id,
    );
    const blocks: User[] = blockships.map((blockship) => {
      if (blockship.user.id === user.id) {
        return blockship.otherUser;
      }
      return blockship.user;
    });
    return blocks;
  }

  async getAllBlockedBy(user: User): Promise<User[]> {
    const blockships =
      await this.friendsBlockRepository.findBlockedByIdWithUser(user.id);
    const blockedBy: User[] = blockships.map((blockship) => {
      if (blockship.user.id === user.id) {
        return blockship.otherUser;
      }
      return blockship.user;
    });
    this.logger.debug(`${user.nickname} is blocked by: ${blockedBy.length}`);
    return blockedBy;
  }

  async isBlocked(userId: number, otherUserId: number) {
    const isblocked = await this.friendsBlockRepository.findBlockByIds(
      userId,
      otherUserId,
    );
    if (isblocked) {
      return true;
    }
    return false;
  }

  async getPendingRequests(user: User): Promise<User[]> {
    const pendingRequests = await this.friendsRepository.findPendingRequests(
      user.id,
    );
    return pendingRequests.map((pendingRequest) => {
      return pendingRequest.otherUser;
    });
  }

  async getReceivedFriendships(user: User): Promise<User[]> {
    const receivedRequests = await this.friendsRepository.findReceived(user.id);
    return receivedRequests.map((receivedRequest) => {
      return receivedRequest.user;
    });
  }

  async requestFriendship(user: User, id: number): Promise<Friendship> {
    if (user.id === id) {
      throw new BadRequestException('본인에게 친구 요청은 불가능합니다.');
    }
    const otherUser = await this.userRepository.findOneBy({ id });
    if (!otherUser) {
      throw new NotFoundException(userNotFoundErr);
    }
    const isExist = await this.friendsRepository.findOneByIds(user.id, id);
    if (isExist) {
      throw new BadRequestException(isExistRequestErr);
    }
    const friendship = this.friendsRepository.create({
      user,
      otherUser,
      status: FriendStatus.PENDING,
    });
    return this.friendsRepository.save(friendship);
  }

  async requestBlockship(user: User, id: number): Promise<Blockship> {
    if (user.id === id) {
      throw new BadRequestException('본인에게 친구 block 요청은 불가능합니다.');
    }
    const otherUser = await this.userRepository.findOneBy({ id });
    if (!otherUser) {
      throw new NotFoundException(userNotFoundErr);
    }
    const isExist = await this.friendsBlockRepository.findBlockByIds(
      user.id,
      id,
    );
    if (isExist) {
      throw new BadRequestException('이미 블락한 유저입니다.');
    }
    const blockship = await this.friendsBlockRepository.create({
      user,
      otherUser,
    });
    this.ChannelsService.leaveDmbySelf(user, otherUser);
    this.logger.log(`${user.id} blocked ${otherUser.id}`);
    return this.friendsBlockRepository.save(blockship);
  }

  async deleteRequest(userId: number, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOnePendingRequest(
      userId,
      id,
    );
    if (!friendship) {
      throw new NotFoundException(requestNotFoundErr);
    }
    return this.friendsRepository.remove(friendship);
  }

  async approveFriendship(userId: number, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOnePendingRequest(
      id,
      userId,
    );
    if (!friendship) {
      throw new NotFoundException(requestNotFoundErr);
    }
    friendship.status = FriendStatus.APPROVED;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { achievements: true },
    });

    const otherUser = await this.userRepository.findOne({
      where: { id },
      relations: { achievements: true },
    });

    if (
      !user.achievements.find(
        (achievement) => achievement.title == Title.FIRST_FREINDSHIP,
      )
    ) {
      this.achievementService.add(user, Title.FIRST_FREINDSHIP);
    }

    if (
      !otherUser.achievements.find(
        (achievement) => achievement.title == Title.FIRST_FREINDSHIP,
      )
    ) {
      this.achievementService.add(otherUser, Title.FIRST_FREINDSHIP);
    }

    return this.friendsRepository.save(friendship);
  }

  async deleteFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOneApproved(
      user.id,
      id,
    );
    if (!friendship) {
      throw new NotFoundException(friendshipNotFoundErr);
    }
    return this.friendsRepository.remove(friendship);
  }

  async deleteBlockship(user: User, id: number): Promise<Blockship> {
    const blockship = await this.friendsBlockRepository.findBlockByIds(
      user.id,
      id,
    );
    if (!blockship) {
      throw new NotFoundException(friendshipNotFoundErr);
    }
    return this.friendsBlockRepository.remove(blockship);
  }

  async isFriend(userId: number, otherUserId: number): Promise<boolean> {
    const friendship = await this.friendsRepository.findOneApproved(
      userId,
      otherUserId,
    );
    if (friendship) {
      return true;
    }
    return false;
  }

  async getBlockedArray(user: User): Promise<number[]> {
    const blockships = await this.getAllDoBlocks(user);
    const blockedArray = blockships.map((blockship) => blockship.id);
    return blockedArray;
  }

  async deleteAllBlocks(user: User) {
    const blockships = await this.friendsBlockRepository.findBlockById(user.id);
    for (const blockship of blockships) {
      this.friendsBlockRepository.delete({ userId: blockship.userId });
    }
  }
}
