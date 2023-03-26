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
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import {
  friendshipNotFoundErr,
  isExistRequestErr,
  requestNotFoundErr,
} from './friends.constants';
import { Friendship, FriendStatus } from './friendship.entity';

@Injectable()
@UseInterceptors(ClassSerializerInterceptor)
export class FriendsService {
  private logger: Logger = new Logger(FriendsService.name);

  constructor(
    @InjectRepository(Friendship)
    private readonly friendsRepository: Repository<Friendship>,
    private readonly usersService: UsersService,
  ) {}

  async getAllFriends(user: User): Promise<Set<User>> {
    const friendships = await this.findApprovedFriendships(user);
    const friends = new Set<User>();
    friendships.forEach((friendship: Friendship) => {
      if (friendship.userId !== user.id) {
        friends.add(friendship.user);
      }
      if (friendship.otherUserId !== user.id) {
        friends.add(friendship.otherUser);
      }
    });
    this.logger.debug(`${user.nickname}'s friends: ${friends}`);
    return friends;
  }

  async findApprovedFriendships(user: User): Promise<Friendship[]> {
    const friendships = await this.friendsRepository.find({
      where: [
        { userId: user.id, status: FriendStatus.APPROVED },
        { otherUserId: user.id, status: FriendStatus.APPROVED },
      ],
      relations: { user: true, otherUser: true },
    });
    return friendships;
  }

  async getPendingRequests(user: User): Promise<User[]> {
    const pendingRequests = await this.friendsRepository.find({
      where: [{ userId: user.id, status: FriendStatus.PENDING }],
      relations: { otherUser: true },
    });
    return pendingRequests.map((pendingRequest) => {
      return pendingRequest.otherUser;
    });
  }

  async getReceivedFriendships(user: User): Promise<User[]> {
    const receivedRequests = await this.friendsRepository.find({
      where: [{ otherUserId: user.id, status: FriendStatus.PENDING }],
      relations: { user: true },
    });
    return receivedRequests.map((receivedRequest) => {
      return receivedRequest.user;
    });
  }

  async requestFriendship(user: User, id: number): Promise<Friendship> {
    const isExist = await this.friendsRepository.findOne({
      where: [
        { userId: user.id, otherUserId: id },
        { userId: id, otherUserId: user.id },
      ],
    });
    if (isExist) {
      throw new BadRequestException(isExistRequestErr);
    }
    const otherUser = await this.usersService.getById(id);
    const friendship = this.friendsRepository.create({
      user,
      otherUser,
      status: FriendStatus.PENDING,
    });
    return this.friendsRepository.save(friendship);
  }

  async deleteRequestedFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        { userId: user.id, otherUserId: id, status: FriendStatus.PENDING },
      ],
    });
    if (!friendship) {
      throw new NotFoundException(requestNotFoundErr);
    }
    return this.friendsRepository.remove(friendship);
  }

  async approveFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        { userId: id, otherUserId: user.id, status: FriendStatus.PENDING },
      ],
    });
    if (!friendship) {
      throw new NotFoundException(requestNotFoundErr);
    }
    friendship.status = FriendStatus.APPROVED;
    return this.friendsRepository.save(friendship);
  }

  async deleteFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        { userId: user.id, otherUserId: id, status: FriendStatus.APPROVED },
        { userId: id, otherUserId: user.id, status: FriendStatus.APPROVED },
      ],
    });
    if (!friendship) {
      throw new NotFoundException(friendshipNotFoundErr);
    }
    return this.friendsRepository.remove(friendship);
  }
}
