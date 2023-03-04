import { Injectable } from "@nestjs/common";
import { v4 as uuid } from 'uuid';
import { Namespace, Socket } from 'socket.io';
import { GameService } from "./game.service";

@Injectable()
export class LobbyService {
  constructor(private gameService: GameService) {}

  invite_to_game(socket : Socket, userinfo : string) {
    console.log(`gamehome : ${userinfo}에 대한 초대 이벤트 발생 from ${socket.id}`);
  }

  spectate_game(socket : Socket, userinfo : string){
    console.log(`gamehome : ${userinfo}에 대한 관전 이벤트 발생 from ${socket.id}`);
  }
  
  join_queue(nsp: Namespace, socket : Socket) : boolean {
    console.log(`game : ${socket.id} 큐에 진입시도`);

    if (this.__queue.has(socket.id)) {
      console.log(`game : 이미 큐에 있음. queuesize : ${this.__queue.size}`);
      return false;
    }
  
    this.__queue.set(socket.id, socket);
    socket.emit("joined_to_queue");
    if ( this.__queue.size > 1 ){
      this.__match_make(nsp);
      return true;
    }
    return false;
  }

  quit_queue(socket : Socket) {
    console.log(`game : ${socket.id} 큐에서 나가기 시도`);

    if ( this.__queue.delete(socket.id)  === false) {
        console.log(`game : 큐에 없음`);
    } else {
        socket.emit('out_of_queue');
    }
  }

  /* ======= private ====== */
  private __queue : Map<string, Socket> = new Map<string, Socket>();

  private __match_make(nsp : Namespace) {
    const p1 : Socket = this.__queue.values().next().value;
    this.__queue.delete(p1.id);
    p1.emit("out_of_queue");
    const p2 : Socket = this.__queue.values().next().value;
    this.__queue.delete(p2.id);
    p2.emit("out_of_queue");

    console.log(`game : p1 is ${p1.id}`);
    console.log(`game : p2 is ${p2.id}`);
    console.log(`game : queuesize : ${this.__queue.size}`);
    
    const roomId : string = "game_" + uuid();
    p1.join(roomId);
    p2.join(roomId);
    nsp.to(roomId).emit("enter_to_game", roomId, p1.id, p2.id);
    this.gameService.makeNewRoom(roomId, p1.id, p2.id);
  }
}
