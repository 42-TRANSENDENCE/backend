import { Injectable, Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { GameMode, GameType } from '../game.interface';
import { MatchDto, QueueDto } from '../lobby/lobby.interface';
import { Player, PlayerStatus } from '../player/player.interface';
import { v4 as uuidv4 } from 'uuid';
import { PlayerService } from '../player/player.service';
import { GameService } from '../game.service';

@Injectable()
export class QueueService {
  private logger: Logger = new Logger(QueueService.name);
  private normalGameQueue: string[] = [];
  private specialGameQueue: string[] = [];

  constructor(
    private readonly playerService: PlayerService,
    private readonly gameService: GameService,
  ) {}

  joinQueue(server: Namespace, client: Socket, data: QueueDto): boolean {
    const queue =
      data.mode === GameMode.NORMAL
        ? this.normalGameQueue
        : this.specialGameQueue;

    queue.push(client.id);
    this.logger.log(`client: ${client.id} joined to queue`);
    client.emit('joined_to_queue');

    if (queue.length > 1) {
      this.matchMaking(server, queue, data.mode);
      return true;
    }
    return false;
  }

  leaveQueue(client: Socket) {
    let queueSize = this.normalGameQueue.length;
    this.normalGameQueue = this.normalGameQueue.filter((id) => {
      id !== client.id;
    });
    if (queueSize !== this.normalGameQueue.length) {
      this.logger.log(`client: ${client.id} left queue`);
      client.emit('out_of_queue');
    }
    queueSize = this.specialGameQueue.length;
    this.specialGameQueue = this.specialGameQueue.filter((id) => {
      id !== client.id;
    });
    if (queueSize !== this.specialGameQueue.length) {
      this.logger.log(`client: ${client.id} left queue`);
      client.emit('out_of_queue');
    }
  }

  // ! Match Making System
  private matchMaking(server: Namespace, queue: string[], mode: GameMode) {
    const player1: Player = this.playerService.get(queue.shift());
    const player2: Player = this.playerService.get(queue.shift());

    const p1: Socket = server.sockets.get(player1.id);
    const p2: Socket = server.sockets.get(player2.id);

    const roomId = `game_${uuidv4()}`;
    p1.join(roomId);
    player1.room = roomId;
    player1.status = PlayerStatus.INGAME;
    p2.join(roomId);
    player2.room = roomId;
    player2.status = PlayerStatus.INGAME;

    const matchInfo: MatchDto = {
      p1: player1,
      p2: player2,
      roomId,
      mode,
    };
    server.to(roomId).emit('match_maked', matchInfo);

    this.logger.log(
      `match maked : ${player1.user.nickname} vs ${player2.user.nickname}`,
    );
    this.logger.log(`remaining users : ${queue.length}`);

    this.gameService.init(matchInfo, GameType.RANK);
  }
}
