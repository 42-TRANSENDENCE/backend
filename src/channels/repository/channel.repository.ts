import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
// import { FriendStatus, Friendship } from './friendship.entity';
import { Channel, ChannelStatus } from '../entity/channels.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMember } from '../entity/channelmember.entity';
import { ChannelBanMember } from '../entity/channelbanmember.entity';
// import {}

@Injectable()
export class ChannelRepository extends Repository<Channel> {
  constructor(
    @InjectRepository(Channel)
    private readonly repository: Repository<Channel>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  private logger = new Logger(ChannelRepository.name);

  async findByIdWithOwner(id: number) {
    return this.repository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  async findByIdwithOwnerMember(id: number) {
    return await this.repository.findOne({
      where: { id },
      relations: {
        members: true,
        owner: true,
      },
    });
  }

  async findByIdwithMember(id: number) {
    return await this.repository.findOne({
      where: { id },
      relations: {
        members: true,
      },
    });
  }

  async findById(id: number) {
    return this.repository.findOneBy({ id });
  }

  async findPublicAndProtectedChannels() {
    const statuses = [ChannelStatus.PUBLIC, ChannelStatus.PROTECTED];
    const channels = await this.repository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.owner', 'owner')
      .where('channel.status IN (:...statuses)', {
        statuses,
      })
      .getMany();
    return channels;
  }

  async findMyChannels(channelIds: number[]) {
    return await this.repository
      .createQueryBuilder('channel')
      .where('channel.id IN (:...channelIds)', { channelIds })
      .leftJoinAndSelect('channel.owner', 'owner') // Specify the relationship name ('owner' in this case)
      .getMany();
  }

  async findOnebyTitle(title: string) {
    return await this.repository.findOneBy({ title });
  }

  async findCurChannelById(channelId: number) {
    return await this.repository.findOneBy({ id: channelId });
  }

  async findCurChannelWithMemberWithOwner(channelId: number) {
    return await this.repository.findOne({
      where: { id: channelId },
      relations: {
        members: true,
        owner: true,
      },
    });
  }
}
