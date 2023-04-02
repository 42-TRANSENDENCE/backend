import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FriendStatus, Friendship } from './friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FriendsRepository extends Repository<Friendship> {
  constructor(
    @InjectRepository(Friendship)
    private readonly repository: Repository<Friendship>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  findApproved(userId: number) {
    return this.repository.find({
      where: [
        { userId: userId, status: FriendStatus.APPROVED },
        { otherUserId: userId, status: FriendStatus.APPROVED },
      ],
      relations: { user: true, otherUser: true },
    });
  }

  findOneApproved(userId: number, otherUserId: number) {
    return this.repository.findOne({
      where: [
        { userId, otherUserId, status: FriendStatus.APPROVED },
        {
          userId: otherUserId,
          otherUserId: userId,
          status: FriendStatus.APPROVED,
        },
      ],
    });
  }

  findPendingRequests(userId: number) {
    return this.repository.find({
      where: [{ userId, status: FriendStatus.PENDING }],
      relations: { otherUser: true },
    });
  }

  findOnePendingRequest(userId: number, otherUserId: number) {
    return this.repository.findOne({
      where: [{ userId, otherUserId, status: FriendStatus.PENDING }],
    });
  }

  findReceived(userId: number) {
    return this.repository.find({
      where: [{ otherUserId: userId, status: FriendStatus.PENDING }],
      relations: { user: true },
    });
  }

  findOneByIds(userId: number, otherUserId: number) {
    return this.repository.findOne({
      where: [
        { userId: userId, otherUserId: otherUserId },
        { userId: otherUserId, otherUserId: userId },
      ],
    });
  }
}
