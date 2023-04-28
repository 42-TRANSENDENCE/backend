import { forwardRef, Inject, Logger } from '@nestjs/common';
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
import { emitMemberDto } from './dto/emit-member.dto';
import { User } from 'src/users/users.entity';
import { newChatResponseDto } from './chats/dto/newChats.dto';
import { ChatResponseDto } from './chats/dto/chats-response.dto';

export interface HowMany {
  joinSockets: number;
  joinMembers: number;
}

// FRONTEND_URL="http://localhost:5173"
// const originUrl = process.env.FRONTEND_URL;
@WebSocketGateway({ namespace: 'channelchat' })
export class ChannelsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService, // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private userSocketMap = new Map<number, string>();
  private logger = new Logger(ChannelsGateway.name);

  @WebSocketServer() nsp: Namespace;
  // server: Server;
  afterInit() {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결`);
    const user: User = await this.channelsService.getUserFromSocket(socket);
    try {
      this.logger.debug(`handle connections  user: ${JSON.stringify(user.id)}`);
    } catch (error) {}
    // if (!user) throw new NotFoundException('유저가 없습니다.');
    if (user) {
      this.logger.log(`${user.nickname} : ${socket.id}`);
      this.channelsService.mappingUserToSocketId(user.id, socket.id);
      this.channelsService.connectAlredyJoinedChannel(user, socket);
    }
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
    this.logger.log(`${socket.id} 가 ${channelId} 에 들어왔다 Well Done 111! `);
    // socket.emit('message',{message: `${socket.id} 가 들어왔다 Well Done ! `})
    // 잘 보내지나 확인용
    this.logger.log(
      `소켓에 연결된 사람수 : ${this.getClientsInRoom(channelId)}`,
    );
    this.nsp.to(channelId).emit('welcomeChannel', {
      message: `${socket.id} 가 ${channelId} 에 들어왔다 Well Done ! `,
    });
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
    this.logger.log(
      `소켓에 연결된 사람수 : ${this.getClientsInRoom(leaveDto.channelId)}`,
    );
    this.channelsService.userExitChannel(leaveDto.channelId, leaveDto.userId);
  }
  async exitWithSocketLeave(channelId: number, userId: number) {
    const socketId = await this.channelsService.getSocketList(userId);
    // const socket = this.server.sockets.connected[socketId];
    this.logger.debug(`socketId : ${socketId}`);
    // this.
  }
  async sendEmitMessage(sendChat: Chat) {
    const channelId = sendChat.channelId;
    // 방에 연결된 사람, 즉 멤버한테만 보내야 한다. 그 소켓에 직접
    const sendChatDto = new ChatResponseDto(sendChat);
    // this.channelsService.get
    // block이 있으면 block배열 담아서
    //
    // socket
    //   .except(socket.id)
    //   .to(channelId.toString())
    //   .emit('message', sendChatDto);
    this.nsp.to(channelId.toString()).emit('message', sendChatDto);
  }

  async emitOutMember(userId: number, channelId: number) {
    const emitmember = new emitMemberDto(userId, channelId);
    this.nsp.to(channelId.toString()).emit('outMember', emitmember);
  }
  async emitInMember(userId: number, channelId: number) {
    const emitmember = new emitMemberDto(userId, channelId);
    this.nsp.to(channelId.toString()).emit('inMember', emitmember);
  }

  async emitBlockMember(userId: number, channelId: number) {
    const emitmember = new emitMemberDto(userId, channelId);
    this.nsp.to(channelId.toString()).emit('blockMember', emitmember);
  }
  // async emitBlockShip(socketId: string[]) {
  //   // const test = await this.channelsService.getSocketList(user.id);
    
  //   // this.logger.debug(JSON.stringify(test));
  // }
  // async emitUnBlockShip(userId: number, channelId: number) {}
  async emitMuteMember(userId: number, channelId: number) {
    const emitmember = new emitMemberDto(userId, channelId);
    this.nsp.to(channelId.toString()).emit('muteMember', emitmember);
  }
  async emitAdminInfo(userId: number, channelId: number) {
    const emitmember = new emitMemberDto(userId, channelId);
    this.nsp.to(channelId.toString()).emit('adminMember', emitmember);
  }
  // content +
  async sendNewEmitMessage(sendChat: Chat) {
    const chatDto = new newChatResponseDto(sendChat);
    this.nsp.emit('newMessage', chatDto);
  }

  async EmitChannelInfo(channelReturned) {
    const curChannel = new EmitChannelInfoDto(channelReturned);
    return this.nsp.emit('newChannel', curChannel);
  }

  async EmitBlockChannelOutSelf(channelReturned) {
    const curChannel = new EmitChannelInfoDto(channelReturned);
    // return this.io.to(socketId).emit('newChannel', curChannel);
    // return socket.emit('removeChannel', curChannel);
    return this.nsp.to(channelReturned.id).emit('removeChannel', curChannel);
    // return this.sockets.emit('newChannel', curChannel);
  }
  async EmitChannelDmInfo(channelReturned) {
    const curChannel = new EmitChannelInfoDto(channelReturned);
    return this.nsp
      .to(curChannel.id.toString())
      .emit('newChannelDm', curChannel);
  }

  async EmitDeletChannelInfo(channelReturned) {
    const curChannel = new EmitChannelInfoDto(channelReturned);
    return this.nsp.emit('removeChannel', curChannel);
  }
  async connectAlreadyChnnels(channels: number[], socket: Socket) {
    channels.forEach((channel) => {
      socket.join(channel.toString());
      this.logger.debug(
        `이방에 ${channel} 연결된 사람 의수 : ${this.getClientsInRoom(
          channel.toString(),
        )}`,
      );
    });
  }
}
