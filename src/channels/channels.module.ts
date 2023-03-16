import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { EventsModule } from 'src/events/events.module';
@Module({
  imports: [TypeOrmModule.forFeature([Channels, User, ChannelMember]), EventsModule],
  providers: [ChannelsService],
  controllers: [ChannelsController]
})
export class ChannelsModule {}
