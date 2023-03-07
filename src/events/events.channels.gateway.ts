import { SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import { Server } from 'socket.io';
@WebSocketGateway()
export class ChannelsGateway {
  @WebSocketServer()
  server: Server;

  handleConnection() {
    console.log('Client connected');
  }
}

