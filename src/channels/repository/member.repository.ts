import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
// import { FriendStatus, Friendship } from './friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMember } from '../entity/channelmember.entity';
// import {}

@Injectable()
export class MemberRepository extends Repository<ChannelMember> {
  constructor(
    @InjectRepository(ChannelMember)
    private readonly repository: Repository<ChannelMember>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  private logger = new Logger(MemberRepository.name);

  async findOneChannelIdUserId(channelId: number, userId: number) {
    return await this.repository.findOne({
      where: { channelId: channelId, userId: userId },
    });
  }

  async findMemberByChannelId(channelId: number) {
    return await this.repository.find({
      where: { channelId: channelId },
    });
  }

  async findMemberByUserId(userId: number) {
    return await this.repository.find({
      where: { userId: userId },
    });
  }

  async findMemberByUserIdwithQuery(userId: number) {
    return await this.repository
      .createQueryBuilder('channel_member')
      .where('channel_member.userId = :userId', { userId: userId })
      .getOne();
  }

  async findMemberByChannelIdWithUser(channelId: number) {
    return await this.repository.find({
      where: { channelId: channelId },
      relations: { user: true },
    });
  }
}
