import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
// import { ChannelsGateway } from './events.channels.gateway';
import { Server, Socket, Namespace } from 'socket.io';
import { Channels } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';

// interface MessagePayload {
//   roomName: string;
//   message: string;
// }
let createdRooms: string[] = [];

@WebSocketGateway({
  namespace:'channelchat',
  cors: {
    origin: ['http://localhost:3000/api/room_list/room'],
  },
})
export class ChannelsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // constructor(private readonly ChannelsService: ChannelsService) { }
  private logger = new Logger('ChannelsGateway')

  @WebSocketServer() nsp: Namespace
  server: Server;

  // 클라이언트, 프론트가 나한테 보내는 이벤트 .
  afterInit() {
    this.nsp.adapter.on('join-room', (room, id) => {
      this.logger.log(`"Socket:${id}"이 "Room:${room}"에 참여하였습니다.`);
    });

    this.nsp.adapter.on('leave-room', (room, id) => {
      this.logger.log(`"Socket:${id}"이 "Room:${room}"에서 나갔습니다.`);
    });

    this.nsp.adapter.on('delete-room', (roomName) => {
      this.logger.log(`"Room:${roomName}"이 삭제되었습니다.`);
    });

    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log("TEST ---------------- get connection")
    this.logger.log(`${socket.id} 소켓 연결`);
    socket.broadcast.emit('message', {
      message: `${socket.id}가 들어왔습니다.`,
    });
  }


  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결 해제 ❌`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket : Socket,
    @MessageBody() message: string,
  ) {
    socket.broadcast.emit('message', { username: socket.id, message})
    return { username:socket.id, message};
  }
  
  
  @SubscribeMessage('newRoom')
  async handleCreateRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() Channel: Channels,
  ) {
    this.logger.log("---------------newRoom self event")
    return { Channel };
  }
}
    // socket.join(roomName); // 기존에 없던 room으로 join하면 room이 생성됨
    // createdRooms.push(roomName); // 유저가 생성한 room 목록에 추가
    // this.nsp.emit('create-room', roomName); // 대기실 방 생성
    // return { success: true, payload: roomName };
  