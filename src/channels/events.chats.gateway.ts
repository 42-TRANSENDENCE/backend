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

import { Chat } from './chats/chats.entity';
import { Server, Socket, Namespace } from 'socket.io';
import { ChannelsService } from 'src/channels/channels.service';
import { leaveDto } from './dto/leave.dto';
import { EmitChannelInfoDto } from './dto/emit-channel.dto';
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
  @SubscribeMessage('closeChannel')
  handlecloseRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody('channelId') channelId: string,
  ) {
    if (!channelId) throw new WsException('There is no user or channelId here');
    this.logger.debug(socket.id);
    socket.leave(channelId);
    this.logger.log(
      `${socket.id} 가 ${channelId} 에 서 나갔다 !  Well Done ! `,
    );
    // socket.emit('message',{message: `${socket.id} 가 들어왔다 Well Done ! `})
    // 잘 보내지나 확인용
    this.logger.log(
      `소켓에 연결된 사람수 : ${this.getClientsInRoom(channelId)}`,
    );
    this.nsp.to(channelId).emit('byeChannel', {
      message: `${socket.id} 가 ${channelId} 에서 나갔다 ! Well Done ! `,
    });

    // socket.broadcast
    //   .to(channelId)
    //   .emit('message', { message: `${socket.id} 가 들어왔다 Well Done ! ` });
  }
  @SubscribeMessage('joinChannel')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody('channelId') channelId: string,
  ) {
    if (!channelId) throw new WsException('There is no user or channelId here');
    this.logger.debug(socket.id);
    socket.join(channelId);
    this.logger.log(`${socket.id} 가 ${channelId} 에 들어왔다 Well Done ! `);
    // socket.emit('message',{message: `${socket.id} 가 들어왔다 Well Done ! `})
    // 잘 보내지나 확인용
    this.logger.log(
      `소켓에 연결된 사람수 : ${this.getClientsInRoom(channelId)}`,
    );
    this.nsp.to(channelId).emit('welcomeChannel', {
      message: `${socket.id} 가 ${channelId} 에 들어왔다 Well Done ! `,
    });

    // socket.broadcast
    //   .to(channelId)
    //   .emit('message', { message: `${socket.id} 가 들어왔다 Well Done ! ` });
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: string,
  ) {
    socket.broadcast.emit('message', { username: socket.id, message });
    return { username: socket.id, message };
  }

  async sendEmitMessage(sendChat: Chat) {
    const channelId = sendChat.channelId;
    this.nsp.to(channelId.toString()).emit('message', sendChat);
  }

  async emitOutMember(userId: number, channelId: number) {
    this.nsp.to(channelId.toString()).emit('outMember');
  }

  async EmitChannelInfo(channelReturned) {
    const curChannel = new EmitChannelInfoDto(channelReturned);
    return this.nsp.emit('newChannel', curChannel);
  }
  async EmitDeletChannelInfo(channelReturned) {
    const curChannel = new EmitChannelInfoDto(channelReturned);
    return this.nsp.emit('removeChannel', curChannel);
  }
  @SubscribeMessage('leaveChannel')
  handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() leaveDto: leaveDto,
  ) {
    //소켓 연결 끊기 **
    //channelId,userId가 없을때 예외 처리
    // this.logger.debug(`----${leaveDto.channelId} , ${leaveDto.userId}`)
    if (!leaveDto.channelId || !leaveDto.userId)
      throw new WsException('There is no user or channelId here');
    socket.leave(leaveDto.channelId);
    this.logger.log(`Client ${socket.id} left room ${leaveDto.channelId}`);
    this.channelsService.userExitChannel(
      socket,
      leaveDto.channelId,
      leaveDto.userId,
    );
  }
}
