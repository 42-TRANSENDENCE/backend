import {
  BadRequestException,
  ClassSerializerInterceptor,
  Injectable,
  Logger,
  NotFoundException,
  UseInterceptors,
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

@Injectable()
@UseInterceptors(ClassSerializerInterceptor)
export class FriendsService {
  private logger: Logger = new Logger(FriendsService.name);

  constructor(
    private readonly friendsRepository: FriendsRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllFriends(user: User): Promise<User[]> {
    const friendships = await this.friendsRepository.findApproved(user.id);
    const friends: User[] = friendships.map((friendship) => {
      if (friendship.user === user) {
        return friendship.otherUser;
      }
      return friendship.user;
    });
    this.logger.debug(`${user.nickname}'s friend: ${friends.length}`);
    return friends;
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
}
