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
import { Socket } from 'socket.io';

@Injectable()
@UseInterceptors(ClassSerializerInterceptor)
export class FriendsService {
  private logger: Logger = new Logger(FriendsService.name);

  constructor(
    private readonly friendsRepository: FriendsRepository,
    @InjectRepository(Blockship)
    private BlocksRepository: Repository<Blockship>,
    @Inject(forwardRef(() => ChannelsService))
    private ChannelsService: ChannelsService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly achievementService: AchievementService,
  ) {}

  async getAllFriends(user: User): Promise<User[]> {
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
    const blockships = await this.BlocksRepository.find({
      where: { userId: user.id },
      relations: { user: true, otherUser: true },
    });
    const friends: User[] = blockships.map((blockship) => {
      if (blockship.user.id === user.id) {
        return blockship.otherUser;
      }
      return blockship.user;
    });
    this.logger.debug(`${user.nickname}'s friend: ${friends.length}`);
    return friends;
  }

  async getAllBlockedBy(user: User): Promise<User[]> {
    const blockships = await this.BlocksRepository.find({
      where: { otherUserId: user.id },
      relations: { user: true, otherUser: true },
    });
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
    const isblocked = await this.BlocksRepository.findOne({
      where: { userId, otherUserId },
    });
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

  async requestBlockship(
    user: User,
    id: number,
    socket: Socket,
  ): Promise<Blockship> {
    if (user.id === id) {
      throw new BadRequestException('본인에게 친구 block 요청은 불가능합니다.');
    }
    const otherUser = await this.userRepository.findOneBy({ id });
    if (!otherUser) {
      throw new NotFoundException(userNotFoundErr);
    }
    const isExist = await this.BlocksRepository.findOne({
      where: { userId: user.id, otherUserId: id },
    });
    if (isExist) {
      throw new BadRequestException('이미 블락한 유저입니다.');
    }
    const blockship = await this.BlocksRepository.create({
      user,
      otherUser,
    });
    this.ChannelsService.leaveDmbySelf(user, otherUser);
    this.logger.log(`${user.id} blocked ${otherUser.id}`);
    // this.ChannelsService.emitBlockShip(user, otherUser);
    return this.BlocksRepository.save(blockship);
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
    const blockship = await this.BlocksRepository.findOne({
      where: { userId: user.id, otherUserId: id },
    });
    if (!blockship) {
      throw new NotFoundException(friendshipNotFoundErr);
    }
    // this.ChannelsService.emitUnBlockShip(user.id, id);
    return this.BlocksRepository.remove(blockship);
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
    this.logger.log(`TEST : ${user.id} this is blockedArray : ${blockedArray}`);
    return blockedArray;
  }

  async deleteAllBlocks(user: User) {
    const blockships = await this.BlocksRepository.find({
      where: { userId: user.id },
    });
    // const blockA = await this.getAllDoBlocks(user);
    // const blockB = await this.getAllBlockedBy(user);
    for (const blockship of blockships) {
      this.BlocksRepository.delete({ userId: blockship.userId });
    }
  }
}
