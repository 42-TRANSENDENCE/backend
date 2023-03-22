import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chats } from './chats.entity'
import { User } from 'src/users/users.entity';
import { ChannelsGateway } from 'src/channels/events/events.channels.gateway';
import { Channels } from 'src/channels/channels.entity';
import { ChannelMuteMember } from 'src/channels/channelmutemember.entity';
import { ChannelsService } from 'src/channels/channels.service';

function getKeyByValue(object, value) {
    return Object.keys(object).find((key) =>object[key] === value);
}

@Injectable()
export class ChatsService {
    constructor(
        @InjectRepository(Chats) private chatsRepository: Repository<Chats>,
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Channels) private channelsRepository: Repository<Channels>,
        @InjectRepository(ChannelMuteMember) private channelMuteRpository: Repository<ChannelMuteMember>,
        private readonly channelsService: ChannelsService,
        private readonly channelsGateway: ChannelsGateway,
    ) {}

    async getChats(channel_id: number, myId: number) {
            const curchannel = this.channelsRepository.createQueryBuilder('id').getOne();
            // .leftJoin('user.dms', 'dms', 'dms.senderId = :myId', { myId })
            // .leftJoin('dms', 'workspace', 'workspace.url = :url', { url })
            const curchanelchats = this.chatsRepository.find({ where: {ChannelId : channel_id } });
            return curchanelchats
    }
    async createChats(
        content: string,
        id:number,
        myId: number,
    ){
        const chat = this.chatsRepository.create({
            id: myId,
            SenderId: id,
            content: content
        })
        const saveChat  = await this.chatsRepository.save(chat);
        // this.sendChatToChannel("1",content,user)
        // const chatWithSender = await this.chatsRepository.findOne({
        //     where:{id: saveChat.id},
        //     relations:['Sender'],
        // });
        // const receiverSocketId = getKeyByValue(
        //     onlineMap[`/ws-${workspace.url}`],
        //     Number(id),
        //   );
        // this.channelsGateway.server.to(receiverSocketId).emit('dm', dmWithSender);
    }

    //TODO: 채팅창 연결해서 User.id랑 연결해서 테스트 , 인자들 정리, entity 도 정리 
    async sendChatToChannel(
        roomId : number, 
        chat : string,
        user : User,
    ) {
        console.log(await this.channelsService.isMutted(roomId,2))
        if (await this.channelsService.isMutted(roomId,2))
            throw new UnauthorizedException('YOU ARE MUTTED')
        const chats = this.chatsRepository.create({
            UserId: 1, // Sender가 유저 아님 ? 
            SenderId: 2,//user.id,
            ChannelId: roomId,
            content: chat
        })
        const saveChat  = await this.chatsRepository.save(chats);
        this.channelsGateway.nsp.emit('message',chat)
    }
}
