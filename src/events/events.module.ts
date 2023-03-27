import { Module } from '@nestjs/common';
import { ChannelsGateway } from './events.channels.gateway';

@Module({
  providers: [ChannelsGateway],
  exports: [ChannelsGateway],
})
export class EventsModule {}
