import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chats } from './chats.entity';
import { User } from 'src/users/users.entity';
import { Channels } from 'src/channels/channels.entity';
import { ChannelsGateway } from 'src/channels/channels.gateway';

// function getKeyByValue(object, value) {
//   return Object.keys(object).find((key) => object[key] === value);
// }

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chats) private chatsRepository: Repository<Chats>,
    private readonly channelsGateway: ChannelsGateway,
  ) {}

  async getChats(channelId: number, myId: number) {
    return this.chatsRepository.find({ where: { ChannelId: channelId } });
  }

  async createChats(content: string, id: number, myId: number) {
    const chat = this.chatsRepository.create({
      id: myId,
      SenderId: id,
      content: content,
    });
    const saveChat = await this.chatsRepository.save(chat);
    // const chatWithSender = await this.chatsRepository.findOne({
    //     where:{id: saveChat.id},
    //     relations:['Sender'],
    // });
    // const receiverSocketId = getKeyByValue(
    //     onlineMap[`/ws-${workspace.url}`],
    //     Number(id),
    //   );
    const chatWithSender = await this.chatsRepository.findOneBy({
      id: saveChat.id,
    });
    // relations:['Sender'],
    // this.eventsGateway.server.to(receiverSocketId).emit('dm', dmWithSender);
  }
  async sendChatToChannel(id: number, chat: string, user: User) {
    const chats = this.chatsRepository.create({
      SenderId: 2, // user.id
      ChannelId: id,
      content: chat,
    });
    const saveChat = await this.chatsRepository.save(chats);
    this.channelsGateway.sendEmitMessage(saveChat);
  }
}
