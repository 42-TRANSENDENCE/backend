import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from 'src/entities/Channels';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/entities/ChannelMember';
import { ChannelsGateway } from 'src/events/events.channels.gateway';
@Injectable()
export class ChannelsService {
    constructor(
        @InjectRepository(Channels)
        private channelsRepository: Repository<Channels>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        // private readonly eventsGateway: EventsGateway,
        private readonly channelsGateway: ChannelsGateway,
    ) {}

    async findById(id:number) {
        return this.channelsRepository.findOne({ where: {id}});
    }

    async getChannels() {
        return this.channelsRepository.createQueryBuilder('channels').getMany()
    }

    async createChannels(title: string, password:string, myId: number) {
        const channel = new Channels();
        channel.title = title;
        channel.password = password;
        channel.owner = myId;
        // channel.owner = User.getbyid()~ 해서 나중에 merge 하고 연결 해주자
        const channelReturned = await this.channelsRepository.save(channel);
        // emit an event to the connected WebSocket clients
        console.log('channelReturned:', channelReturned);
        this.channelsGateway.server.emit('channelCreated', channelReturned);
        // const channelMember = new ChannelMember();
        // channelMember.UserId = myId;
        // channelMember.ChannelId = channelReturned.id;
        // await this.channelsRepository.save(channelMember);
    }

    // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
    async getChannelMembers(title: string)
    {
        return this.usersRepository
        .createQueryBuilder('user')
        // .innerJoin('user.Channels', 'channels', 'channels.title = :title', {
        //     title,
        //   })
        .getMany();
    }

}
