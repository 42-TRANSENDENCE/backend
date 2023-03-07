import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chats } from './chats.entity'
import { User } from 'src/users/users.entity';
function getKeyByValue(object, value) {
    return Object.keys(object).find((key) =>object[key] === value);
}

@Injectable()
export class ChatsService {
    constructor(
        @InjectRepository(Chats) private chatsRepository: Repository<Chats>,
        @InjectRepository(User) private usersRepository: Repository<User>,
        // private readonly eventsGateway: EventGateway,
    ) {}

    async getChats(url: string, myId: number) {
        return (
            this.usersRepository
            .createQueryBuilder('user')
            // .leftJoin('user.dms', 'dms', 'dms.senderId = :myId', { myId })
            // .leftJoin('dms', 'workspace', 'workspace.url = :url', { url })
            .getMany()
        );
    }
    async createChats(
        url:string,
        content: string,
        id:number,
        myId: number,
    ){
        // consts 
        // const chat = new Chats();
        // chat.SenderId = myId;
        // chat.ReceiverId = id;
        // chat.content = content;
        const chat = this.chatsRepository.create({
            id: myId,
            SenderId: id,
            content: content
        })
        const saveChat  = await this.chatsRepository.save(chat);
        const chatWithSender = await this.chatsRepository.findOne({
            where:{id: saveChat.id},
            // relations:['Sender'],
        });
        // const receiverSocketId = getKeyByValue(
        //     onlineMap[`/ws-${workspace.url}`],
        //     Number(id),
        //   );
        // this.eventsGateway.server.to(receiverSocketId).emit('dm', dmWithSender);
    }
}
