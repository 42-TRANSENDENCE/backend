import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
// import { ChannelsGateway } from './events.channels.gateway';
import { Server, Socket, Namespace } from 'socket.io';
import { ChannelsService } from 'src/channels/channels.service';
import { onlineMap } from './onlineMaps';
// interface MessagePayload {
//   roomName: string;
//   message: string;
// }
let createdRooms: string[] = [];

@WebSocketGateway({
  namespace:'channel'
})
export class ChannelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // constructor(private readonly ChannelsService: ChannelsService) { }
  private logger = new Logger('ChannelsGateway')

  @WebSocketServer() nsp: Namespace
  server: Server;

  afterInit() {
    this.nsp.adapter.on('create-room', (room) => {
      this.logger.log(`"Room:${room}"이 생성되었습니다.`);
    });

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
    console.log("TEST ---------------- get connection")
    this.logger.log(`${socket.id} 소켓 연결`);
    // if (!onlineMap[socket.nsp.name]) {
    //   onlineMap[socket.nsp.name] = {};
    // }
    // socket.broadcast.emit('message', {
    //   message: `${socket.id}가 들어왔습니다.`,
    // });
  }


  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결 해제 ❌`);
    const newNamespace = socket.nsp;
      delete onlineMap[socket.nsp.name][socket.id];
      newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  }

  // @SubscribeMessage('create-room')
  // handleCreateRoom(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() roomName: string,
  // ) {
  //   if (!onlineMap[socket.nsp.name]) {
  //     onlineMap[socket.nsp.name] = {};
  //   }
  //   socket.emit('hello', socket.nsp.name);
  // }
  @SubscribeMessage('create-room')
  handleCreateRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomName: string,
  ) {
    console.log("TEST ---------- get in-----------")
    const exists = createdRooms.find((createdRoom) => createdRoom === roomName);
    if (exists) {
      return { success: false, payload: `${roomName} 방이 이미 존재합니다.` };
    }
    socket.join(roomName); // 기존에 없던 room으로 join하면 room이 생성됨
    createdRooms.push(roomName); // 유저가 생성한 room 목록에 추가
    this.logger.log(createdRooms)
    this.nsp.emit('create-room', roomName); // 대기실 방 생성
    return { success: true, payload: roomName };
  }
    // socket.join(roomName); // 기존에 없던 room으로 join하면 room이 생성됨
    // createdRooms.push(roomName); // 유저가 생성한 room 목록에 추가
    // this.nsp.emit('create-room', roomName); // 대기실 방 생성


    // return { success: true, payload: roomName };
  }
  // handleConnection(@ConnectedSocket() socket: Socket) {
  //   this.logger.log(`${socket.id} 소켓 연결`);
  //   if (!onlineMap[socket.nsp.name]) {
  //     onlineMap[socket.nsp.name] = {};
  //   }
    // broadcast to all clients in the given sub-namespace
  //   socket.emit('hello', socket.nsp.name);
  // }

  // handleDisconnect(@ConnectedSocket() socket: Socket) {
  //   this.logger.log(`${socket.id} 소켓 연결 해제 ❌`);
  //   const newNamespace = socket.nsp;
  //   delete onlineMap[socket.nsp.name][socket.id];
  //   newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  // }
// }

