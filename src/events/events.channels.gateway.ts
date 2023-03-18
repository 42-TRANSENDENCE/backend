import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';

// interface MessagePayload {
//   roomName: string;
//   message: string;
// }

// 이부분 뭐지? 수정해라..
@WebSocketGateway({
  namespace:'channelchat',
  cors: {
    origin: ['http://localhost:3000'],
  },
})

export class ChannelsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
 
  constructor(
  @Inject(forwardRef(()=>ChannelsService)) private readonly ChannelsService: ChannelsService ){}
  private logger = new Logger('ChannelsGateway')

  @WebSocketServer() nsp: Namespace
  server: Server;

  // 클라이언트, 프론트가 나한테 보내는 이벤트 .
  afterInit() {
    // this.nsp.adapter.on('join-room', (room, id) => {
    //   this.logger.log(`"Socket:${id}"이 "Room:${room}"에 참여하였습니다 Fuck.`);
    // });

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
    this.logger.log('connected', socket.nsp.name);
    this.logger.log(`${socket.id} 소켓 연결`);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결 해제 ❌`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ){
    socket.join(roomId);
    console.log(`${socket.id} 가 ${roomId} 에 들어왔다 Fucnking shit`)
    // socket.emit('message',{message: `${socket.id} 가 들어왔다 Fucnking shit `})
    
    // 잘 보내지나 확인용 
    this.nsp.to(roomId).emit('message',{message: `${socket.id} 가 ${roomId} 에 들어왔다 Fucnking shit `})
    socket.broadcast.to(roomId).emit('message',{message: `${socket.id} 가 들어왔다 Fucnking shit `})
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket : Socket,
    @MessageBody() message: string,
  ) {
    socket.broadcast.emit('message', { username: socket.id, message})
    return { username:socket.id, message};
  }
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ) {
      this.ChannelsService.userExitChannel(socket,roomId)
  }
}