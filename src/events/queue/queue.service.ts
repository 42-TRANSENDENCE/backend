import { Server, Socket } from 'socket.io';
import { GameMode, GameType } from '../../game/game.interface';
import { PongClient, ClientStatus } from '../client/client.interface';
import { v4 as uuidv4 } from 'uuid';
import { ClientService } from '../client/client.service';
import { GameService } from '../../game/game.service';
import { Injectable, Logger } from '@nestjs/common';
import { QueueDto } from '../dto/queue.dto';
import { MatchDto } from '../dto/match.dto';
import { Client } from 'socket.io/dist/client';

@Injectable()
export class QueueService {
  private logger: Logger = new Logger(QueueService.name);
  private normalGameQueue: string[] = [];
  private specialGameQueue: string[] = [];

  constructor(
    private readonly clientService: ClientService,
    private readonly gameService: GameService,
  ) {}

  joinQueue(server: Server, client: Socket, data: QueueDto) {
    if (this.clientService.get(client.id).status !== ClientStatus.ONLINE) {
      client.emit('joinqueue_error', '게임중에는 큐에 참여할 수 없습니다.');
      return;
    }
    if (this.isInQueue(client.id) === true) {
      client.emit('joinqueue_error', '이미 큐에 참여중입니다.');
      return;
    }
    const queue =
      data.mode === GameMode.NORMAL
        ? this.normalGameQueue
        : this.specialGameQueue;
    queue.push(client.id);
    this.logger.log(`client: ${client.id} joined to queue`);
    client.emit('joined_to_queue');

    if (queue.length > 1) {
      this.matchMaking(server, queue, data.mode);
    }
  }

  leaveQueue(client: Socket) {
    if (this.normalGameQueue.includes(client.id)) {
      const queueSize = this.normalGameQueue.length;
      this.normalGameQueue = this.normalGameQueue.filter((id) => {
        id !== client.id;
      });
      if (queueSize !== this.normalGameQueue.length) {
        this.logger.log(`client: ${client.id} left queue`);
        client.emit('out_of_queue');
      }
    } else if (this.specialGameQueue.includes(client.id)) {
      const queueSize = this.specialGameQueue.length;
      this.specialGameQueue = this.specialGameQueue.filter((id) => {
        id !== client.id;
      });
      if (queueSize !== this.specialGameQueue.length) {
        this.logger.log(`client: ${client.id} left queue`);
        client.emit('out_of_queue');
      }
    }
  }

  isInQueue(clientId: string): boolean {
    if (
      this.normalGameQueue.includes(clientId) ||
      this.specialGameQueue.includes(clientId)
    ) {
      return true;
    } else {
      return false;
    }
  }
  // ! Match Making System
  private matchMaking(server: Server, queue: string[], mode: GameMode) {
    const pongClient1: PongClient = this.clientService.get(queue.shift());
    const pongClient2: PongClient = this.clientService.get(queue.shift());

    const roomId = `game_${uuidv4()}`;
    pongClient1.room = roomId;
    pongClient2.room = roomId;

    const matchInfo: MatchDto = {
      p1: pongClient1,
      p2: pongClient2,
      roomId,
      mode,
    };
    pongClient1.socket.emit('match_maked', { roomId, mode });
    pongClient2.socket.emit('match_maked', { roomId, mode });

    this.logger.log(
      `match maked : ${pongClient1.user.nickname} vs ${pongClient2.user.nickname}`,
    );
    this.logger.log(`game_room ID : ${roomId}`);
    this.logger.log(`remaining users : ${queue.length}`);

    this.gameService.init(matchInfo, GameType.RANK);
  }
}
