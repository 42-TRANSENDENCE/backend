import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from 'src/entities/Channels';
import { User } from 'src/users/users.entity';
@Injectable()
export class ChannelsService {
    constructor(
        @InjectRepository(Channels)
        private channelsRepository: Repository<Channels>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        // private readonly eventsGateway: EventsGateway,
    ) {}
    async findById(id:number) {
        return this.channelsRepository.findOne({ where: {id}});
    }

    async getChannels(url:string, myId: number) {
        return this.channelsRepository.createQueryBuilder('channels').getMany()
    }
    async createChannels(url:string, name: string, myId: number) {
        const channel = new Channels();
        channel.name = name;
        const channelReturned = await this.channelsRepository.save(channel);
        // const channelMember = new
    }
}
