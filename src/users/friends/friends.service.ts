import {
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

  async getAllApprovedFriendships(user: User): Promise<Friendship[]> {
    const friendships = await this.friendsRepository.find({
      where: [
        { userId: user.id, status: FriendStatus.APPROVED },
        { otherUserId: user.id, status: FriendStatus.APPROVED },
      ],
      relations: { user: true, otherUser: true },
    });
    return friendships;
  }

  filterBlockedUsers(friends: Set<User>, user: User): Set<User> {
    friends.forEach((friend) => {
      if (user.blocked.find((user) => user === friend)) {
        friends.delete(friend);
      }
    });
    return friends;
  }

  async getAllFriends(id: number): Promise<Set<User>> {
    const user = await this.usersService.getUserByIdWithBlocked(id);
    const friendships = await this.getAllApprovedFriendships(user);
    const friends = new Set<User>();
    friendships.forEach((friendship: Friendship) => {
      if (friendship.userId !== user.id) {
        friends.add(friendship.user);
      }
      if (friendship.otherUserId !== user.id) {
        friends.add(friendship.otherUser);
      }
    });
    return this.filterBlockedUsers(friends, user);
  }

  async getPendingRequests(user: User): Promise<User[]> {
    const pendingRequests = await this.friendsRepository.find({
      where: [{ userId: user.id, status: FriendStatus.PENDING }],
      relations: { otherUser: true },
    });
    const waitingUsers: User[] = pendingRequests.map((pendingRequest) => {
      return pendingRequest.otherUser;
    });
    return waitingUsers;
  }

  async requestFriendship(user: User, id: number): Promise<Friendship> {
    const otherUser = await this.usersService.getById(id);
    const friendship = this.friendsRepository.create({
      user: user,
      otherUser: otherUser,
      status: FriendStatus.PENDING,
    });
    this.friendsRepository.save(friendship);
    return friendship;
  }

  async deleteRequestedFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        { userId: user.id, otherUserId: id, status: FriendStatus.PENDING },
      ],
    });
    if (!friendship) {
      throw new NotFoundException('requested friendship does not exist');
    }
    this.friendsRepository.remove(friendship);
    return friendship;
  }

  async approveFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        { userId: id, otherUserId: user.id, status: FriendStatus.PENDING },
      ],
    });
    if (!friendship) {
      throw new NotFoundException("can't find friendship request");
    }
    friendship.status = FriendStatus.APPROVED;
    this.friendsRepository.save(friendship);
    return friendship;
  }

  async deleteFriendship(user: User, id: number): Promise<Friendship> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        { userId: user.id, otherUserId: id, status: FriendStatus.APPROVED },
        { userId: id, otherUserId: user.id, status: FriendStatus.APPROVED },
      ],
    });
    if (!friendship) {
      throw new NotFoundException("can't find friendship");
    }
    return await this.friendsRepository.remove(friendship);
  }

  async receivedFriendship(user: User): Promise<User[]> {
    const receivedRequests = await this.friendsRepository.find({
      where: [{ otherUserId: user.id, status: FriendStatus.PENDING }],
      relations: { user: true },
    });
    const waitingUsers: User[] = receivedRequests.map((receivedRequest) => {
      return receivedRequest.user;
    });
    return waitingUsers;
  }
}
