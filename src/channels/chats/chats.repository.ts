import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
// import { FriendStatus, Friendship } from './friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './chats.entity';
// import {}

@Injectable()
export class ChatsRepository extends Repository<Chat> {
  constructor(
    @InjectRepository(Chat)
    private readonly repository: Repository<Chat>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  private logger = new Logger(ChatsRepository.name);

  async getChatsWithSenderASC(channelId: number) {
    return await this.repository.find({
      where: { channelId: channelId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
    });
  }
}
