import { HttpCode, Injectable,UnauthorizedException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { ChannelsGateway } from 'src/events/events.channels.gateway';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { response } from 'express';


@Injectable()
export class ChannelsService {
    constructor(
        @InjectRepository(Channels)
        private channelsRepository: Repository<Channels>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(ChannelMember)
        private channelMemberRepository: Repository<ChannelMember>,
        private readonly channelsGateway: ChannelsGateway,
    ) {}
    private logger = new Logger('channelService')
    
    async findById(id:number) {
        return this.channelsRepository.findOne({ where: {id}});
    }

    async getChannels() {
        return this.channelsRepository.createQueryBuilder('channels').getMany()
    }

    async createChannels(title: string, password:string, myId: number) {
        const saltRounds = 10;
        const channel = this.channelsRepository.create({
            title: title,
            password: password,
            owner: myId,
        })
        if(password) {
            const hashedPassword = await bcrypt.hash(password.toString(), saltRounds);
            // channel.private = true;
            channel.private = true;
            channel.password = hashedPassword;
        }
        // channel.owner = User.getbyid()~ 해서 나중에 merge 하고 연결 해주자
        // socket random 으로 만들어서 
        const channelReturned = await this.channelsRepository.save(channel);
        // this.logger.log('channelReturned:', channelReturned.title);
        this.channelsGateway.nsp.emit('newRoom', channelReturned);
        // this.nsp.emit('create-room', createdChannel);
        const channelMember = this.channelMemberRepository.create({
            UserId : myId,
            ChannelId: channelReturned.id,
        })
        await this.channelMemberRepository.save(channelMember);
    }

    // GET 채널 (채팅방) 에 있는 멤버들  Get 하는거.
    async getChannelMembers(channel_id: number)
    {
        return this.channelMemberRepository
        .createQueryBuilder('channel_member')
        .where('channel_member.ChannelId = :channel_id', { channel_id })
        .getMany();
    }

    
    async userEnterPrivateChannel(channel_id: number ,password:string, user:User, curChannel:Channels)
    : Promise<{ message: string, status: number }>
    {
        // 맞으면 채팅방 멤버에추가 해줘야한다. -> channel member entitiy 에 insert 하는거 추가 해야함.
        // const curChannel = await this.channelsRepository.createQueryBuilder()
        // .where('id = :channel_id', {channel_id})
        // .getOne();
        if(password) {
            console.log((await curChannel).password)
            const inputPasswordMatches = await bcrypt.compare(password, (await curChannel).password);
            this.logger.log(inputPasswordMatches)
            if (!inputPasswordMatches) {
                throw new UnauthorizedException('Invalid password');
            }
            else {
                // 맞으면 소켓 연결하고 디비에 추가 채널멤버에(채널멤버 엔티티에 insert 하는거 뭐 추가 해야함 배열에 ) .
                this.logger.log(" debug : Check only Server suceccses")
                //db의 채널 멤버에 나 , user 추가 
                //이미 채널id에 해당하는 멤버가 있으면 추가 ㄴㄴ!
                const isInUser = await this.channelMemberRepository.createQueryBuilder('channel_member')
                .where('channel_member.UserId = :userId', { userId: 1 })
                .getOne()
                // console.log(isInUser)
                if(!isInUser){
                    const cm = this.channelMemberRepository.create({
                        UserId:1, // user.id
                        ChannelId:channel_id
                    })
                    this.channelMemberRepository.save(cm);
                }
                return { message: 'Enter Channel in successfully', status: 200 };
                // res.status(200).send({ message: 'Enter Channel in successfully' });
                // Q.위의 명령어가 Controller 에서만 돼서 Promise 로 받아서 Controller로 전달해서 해결  
                // 근데 왜 그렇지 ??? 어차피 똑같은 얘를 인자로 계속 가져와서 쓰는데
            }
        }
        else { // 비번방인데 비밀번호 입력 안 했을때
            throw new UnauthorizedException('Invalid password');
        }
    }
    async userEnterPublicChannel(channel_id: number ,password:string, user:User, curChannel:Channels)
    : Promise<{ message: string, status: number }>
    {
        // 공개방은 무조건 소켓 연결 근데 + 밴 리스트 !! 는 나중에 
        // this.channelsGateway.nsp.emit('join-room');
        const isInUser = await this.channelMemberRepository.createQueryBuilder('channel_member')
        .where('channel_member.UserId = :userId', { userId: 1 }) // 1 -> user.id
        .getOne()
        // console.log(isInUser)
        if(!isInUser){
            const cm = this.channelMemberRepository.create({
                UserId:1, // user.id
                ChannelId:channel_id
            })
            this.channelMemberRepository.save(cm);
        }
        return { message: 'Enter Channel in successfully', status: 200 };
    }

    async userEnterChannel(channel_id: number ,password:string, user:User)
    :Promise<{ message: string, status: number }>
    {
        const curChannel = await this.channelsRepository.findOne({ where: { id: channel_id } });
        if (curChannel) {
            if (curChannel.private)
                return this.userEnterPrivateChannel(channel_id, password, user, curChannel)
            else
                return this.userEnterPublicChannel(channel_id, password, user, curChannel)
        }
        else  
            throw new UnauthorizedException('Plz Enter Exist Room');
    }
}
