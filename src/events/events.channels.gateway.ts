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
import { Server, Socket, Namespace } from 'socket.io';
import { Chats } from 'src/chats/chats.entity';

// interface MessagePayload {
//   roomName: string;
//   message: string;
// }

// FRONTEND_URL="http://localhost:5173"
const originUrl = process.env.FRONTEND_URL;
@WebSocketGateway({
  namespace: 'channelchat',
  cors: {
    origin: originUrl,
  },
})
export class ChannelsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  // constructor(private readonly ChannelsService: ChannelsService) { }
  private logger = new Logger(ChannelsGateway.name);

  @WebSocketServer() nsp: Namespace;
  server: Server;

  // 클라이언트가, 프론트가 나한테 보내는 이벤트.
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
    this.logger.log('TEST ---------------- get connection');
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
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: string,
  ) {
    socket.broadcast.emit('message', { username: socket.id, message });
    return { username: socket.id, message };
  }
  async sendEmitMessage(sendChat: Chats) {
    // 이부분 해당 방에 해당하는 broadcast로 하는걸로 수정하자 테스트 하면서
    return this.nsp.emit('meesage', sendChat);
  }
  async EmitChannelInfo(channelReturned) {
    return this.nsp.emit('newRoom', channelReturned);
  }
  // @SubscribeMessage('newRoom')
  // async handleCreateRoom(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() Channel: Channels,
  // ) {
  //   // this.logger.log(`TEST : ${socket.id} : `);
  //   return { Channel };
  // }
}
// socket.join(roomName); // 기존에 없던 room으로 join하면 room이 생성됨
// createdRooms.push(roomName); // 유저가 생성한 room 목록에 추가
// this.nsp.emit('create-room', roomName); // 대기실 방 생성
// return { success: true, payload: roomName };
