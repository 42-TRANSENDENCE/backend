import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelcember.entity';
import { ChannelsGateway } from './channels.gateway';
@Module({
  imports: [TypeOrmModule.forFeature([Channels, User, ChannelMember])],
  providers: [ChannelsService, ChannelsGateway],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
