import { Module } from '@nestjs/common';
import { ChannelsModule } from 'src/channels/channels.module';
import { ChannelsGateway } from './chats.gateway';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [forwardRef(() => ChannelsModule)],
  providers: [ChannelsGateway],
  exports: [ChannelsGateway],
})
export class EventsModule {}
