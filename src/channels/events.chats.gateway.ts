import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
  WsException,
} from '@nestjs/websockets';

import { Chats } from './chats/chats.entity';
import { Server, Socket, Namespace } from 'socket.io';
import { ChannelsService } from 'src/channels/channels.service';
import { leaveDto } from './dto/leave.dto';
// interface MessagePayload {
//   roomName: string;
//   message: string;
// }

// FRONTEND_URL="http://localhost:5173"
// const originUrl = process.env.FRONTEND_URL;
@WebSocketGateway({ namespace: 'channelchat' })
export class ChannelsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,
  ) {}
  private logger = new Logger(ChannelsGateway.name);

  @WebSocketServer() nsp: Namespace;
  server: Server;

  // 클라이언트가, 프론트가 나한테 보내는 이벤트.
  afterInit() {
    // this.nsp.adapter.on('join-room', (room, id) => {
    //   this.logger.log(`"Socket:${id}"이 "Room:${room}"에 참여하였습니다.`);
    // });

    // this.nsp.adapter.on('leave-room', (room, id) => {
    //   this.logger.log(`"Socket:${id}"이 "Room:${room}"에서 나갔습니다.`);
    // });

    // this.nsp.adapter.on('delete-room', (roomName) => {
    //   this.logger.log(`"Room:${roomName}"이 삭제되었습니다.`);
    // });

    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결`);
    // socket.broadcast.emit('message', {
    //   message: `${socket.id}가 들어왔습니다.`,
    // });
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결 해제 ❌`);
    // socket.disconnect();
  }

  getClientsInRoom(roomName: string) {
    // const room = this.server.sockets.adapter.rooms.get(roomName);
    const room = this.nsp.adapter.rooms.get(roomName);
    if (room) {
      return room.size;
    } else {
      return 0;
    }
  }

  @SubscribeMessage('join-channel')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody('channelId') channelId: string,
  ) {
    if (!channelId) throw new WsException('There is no user or roomId here');
    this.logger.debug(socket.id);
    socket.join(channelId);
    this.logger.log(`${socket.id} 가 ${channelId} 에 들어왔다 Well Done ! `);
    // socket.emit('message',{message: `${socket.id} 가 들어왔다 Well Done ! `})

    // 잘 보내지나 확인용
    this.logger.log(
      `소켓에 연결된 사람수 : ${this.getClientsInRoom(channelId)}`,
    );
    // this.nsp.to(channelId).emit('message', {
    //   message: `${socket.id} 가 ${channelId} 에 들어왔다 Well Done ! `,
    // });
    //
    socket.broadcast
      .to(channelId)
      .emit('message', { message: `${socket.id} 가 들어왔다 Well Done ! ` });
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
    // 방 넘버 가지고 소켓아이디 알아내서 to로 에밋 하고 broadcast해줘야함.
    return this.nsp.emit('meesage', sendChat);
  }
  async EmitChannelInfo(channelReturned) {
    return this.nsp.emit('newRoom', channelReturned);
  }

  @SubscribeMessage('leave-channel')
  handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() leaveDto: leaveDto,
  ) {
    //소켓 연결 끊기 **
    //roomId,userId가 없을때 예외 처리
    if (!leaveDto.roomId || !leaveDto.userId)
      throw new WsException('There is no user or roomId here');
    // 해당 방에대해 소켓 연결 끊는부분 연결하고 테스트를 해봐야 할듯.!!!!!
    socket.leave(leaveDto.roomId);
    this.logger.log(`Client ${socket.id} left room ${leaveDto.roomId}`);
    this.channelsService.userExitChannel(
      socket,
      leaveDto.roomId,
      leaveDto.userId,
    );
  }
}
