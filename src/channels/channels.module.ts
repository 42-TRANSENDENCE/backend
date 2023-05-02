import { CacheModule, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/channels/entity/channels.entity';
import { ChannelMember } from 'src/channels/entity/channelmember.entity';
// import { EventsModules } from './events.module';
import { forwardRef } from '@nestjs/common';
import { ChannelBanMember } from './entity/channelbanmember.entity';
import { ChatsModule } from './chats/chats.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { EventChatModule } from './events.module';
import { ChannelRepository } from './repository/channel.repository';
import { MemberRepository } from './repository/member.repository';
import { BanMemberRepository } from './repository/banmember.repository';
@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([Channel, ChannelMember, ChannelBanMember]),
    forwardRef(() => ChatsModule),
    forwardRef(() => EventChatModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    ChannelsService,
    ChannelRepository,
    MemberRepository,
    BanMemberRepository,
  ],
  controllers: [ChannelsController],
  exports: [ChannelsService, MemberRepository, BanMemberRepository],
})
export class ChannelsModule {}
