import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/channels/channels.entity';
import { User } from 'src/users/users.entity';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { EventsModule } from 'src/events/events.module';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [TypeOrmModule.forFeature([Channels, User, ChannelMember]), 
  forwardRef(() => EventsModule)],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports:[ChannelsService]
})
export class ChannelsModule {}
