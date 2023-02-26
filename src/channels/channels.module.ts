import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from 'src/entities/Channels';
import { User } from 'src/users/users.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Channels, User])],
  providers: [ChannelsService],
  controllers: [ChannelsController]
})
export class ChannelsModule {}
