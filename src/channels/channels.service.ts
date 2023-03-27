import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelcember.entity';
import { ChannelsGateway } from 'src/events/events.channels.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
@Injectable()
export class ChannelsService {
    constructor(
        @InjectRepository(Channels)
        private channelsRepository: Repository<Channels>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(ChannelMember)
        private channelMemberRepository: Repository<ChannelMember>,
        // private readonly eventsGateway: EventsGateway,
        private readonly channelsGateway: ChannelsGateway,
    ) { }
    private logger = new Logger('channelService')

    async findById(id: number) {
        return this.channelsRepository.findOne({ where: { id } });
    }

    async getChannels() {
        return this.channelsRepository.createQueryBuilder('channels').getMany()
    }

    async createChannels(title: string, password: string, myId: number) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password.toString(), saltRounds);
        const channel = this.channelsRepository.create({
            title: title,
            password: hashedPassword,
            owner: myId,
        })
        // channel.owner = User.getbyid()~ 해서 나중에 merge 하고 연결 해주자
        const channelReturned = await this.channelsRepository.save(channel);
        console.log('channelReturned:', channelReturned.title);
        // this.channelsGateway.nsp.server.emit('create-room', {message:`${channelReturned.title}`});
        const channelMember = this.channelMemberRepository.create({
            UserId: myId,
            ChannelId: channelReturned.id,
        })
        await this.channelMemberRepository.save(channelMember);
    }

    // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
    async getChannelMembers(channel_id: number) {
        return this.channelMemberRepository
            .createQueryBuilder('channel_member')
            .where('channel_member.ChannelId = :channel_id', { channel_id })
            .getMany();
    }

    async userEnterChannel(channel_id: number, password: string, user: User) {
        //private 일때 패스워드 hash compare해서 맞는지 만 체크  
        // 소켓 연결은 나중에 
        // 맞으면 채팅방 멤버에추가 해줘야한다. -> channel member entitiy 에 insert 하는거 추가 해야함.
        const saltRounds = 10;
        const curChannel = await this.channelsRepository.findOne({ where: { id: channel_id } });
        // const curChannel = await this.channelsRepository.createQueryBuilder()
        // .where('id = :channel_id', {channel_id})
        // .getOne();
        const inputPasswordMatches = await bcrypt.compare(password, (await curChannel).password);
        console.log(inputPasswordMatches)
        if (!inputPasswordMatches) {
            throw new UnauthorizedException('Invalid password');
        }
        else {
            // 맞으면 소켓 연결하고 디비에 추가 채널멤버에 .
            console.log("suceccses")
        }

        // const inputhashPassword = await bcrypt.compare(password.toString(), (await curChannel).password);
        // console.log(inputhashPassword)
        return curChannel;

    }
}
