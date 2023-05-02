import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
// import { FriendStatus, Friendship } from './friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelBanMember } from '../entity/channelbanmember.entity';
// import {}

@Injectable()
export class BanMemberRepository extends Repository<ChannelBanMember> {
  constructor(
    @InjectRepository(ChannelBanMember)
    private readonly repository: Repository<ChannelBanMember>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  private logger = new Logger(BanMemberRepository.name);

  async findOneChannelIdUserId(channelId: number, userId: number) {
    return await this.repository.findOne({
      where: { channelId: channelId, userId: userId },
    });
  }

  async findOneChannelIdUserIdWithQuery(channelId: number, userId: number) {
    return await this.repository
      .createQueryBuilder('channel_ban_member')
      .where('channel_ban_member.userId = :userId', {
        userId: userId,
      })
      .andWhere('channel_ban_member.channelId = :channelId', {
        channelId: channelId,
      })
      .getOne();
  }

  async findBanMemberByChannelId(channelId: number) {
    return await this.repository.find({
      where: { channelId: channelId },
    });
  }

  async findBanMemberByUserId(userId: number) {
    return await this.repository.find({
      where: { userId: userId },
    });
  }

  async findBanMemberByUserIdwithQuery(userId: number) {
    return await this.repository
      .createQueryBuilder('channel_member')
      .where('channel_member.userId = :userId', { userId: userId })
      .getOne();
  }

  async findBanMemberByChannelIdWithUser(channelId: number) {
    return await this.repository.find({
      where: { channelId: channelId },
      relations: { user: true },
    });
  }
}
