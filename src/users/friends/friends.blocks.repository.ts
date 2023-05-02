import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Blockship } from './blockship.entity';

@Injectable()
export class FriendsBlocksRepository extends Repository<Blockship> {
  constructor(
    @InjectRepository(Blockship)
    private readonly repository: Repository<Blockship>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  findBlockByIdWithUser(userId: number) {
    return this.repository.find({
      where: { userId: userId },
      relations: { user: true, otherUser: true },
    });
  }

  findBlockById(userId: number) {
    return this.repository.find({
      where: { userId: userId },
      relations: { user: true, otherUser: true },
    });
  }

  findBlockedByIdWithUser(otherUserId: number) {
    return this.repository.find({
      where: { otherUserId: otherUserId },
      relations: { user: true, otherUser: true },
    });
  }

  findBlockByIds(userId: number, otherUserId: number) {
    return this.repository.findOne({
      where: [{ userId: userId, otherUserId: otherUserId }],
    });
  }
}
