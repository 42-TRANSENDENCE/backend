import { Injectable, Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import {
  ACCEL_RATIO,
  ARROW_DOWN,
  ARROW_UP,
  BALL_RAD,
  BALL_VEL_INIT_X,
  BALL_VEL_INIT_Y,
  PADDLE_H,
  PADDLE_L,
  PADDLE_R,
  PADDLE_SPEED,
  PADDLE_W,
  TABLE_BOTTOM,
  TABLE_LEFT,
  TABLE_RIGHT,
  TABLE_TOP,
  WIN_SCORE,
} from './game.constants';
import { Game, GameData, GamePlayDto, GameType } from './game.interface';
import { MatchDto } from '../events/lobby/lobby.interface';
import { HistoryService } from './history/history.service';
import { ClientStatus, PongClient } from 'src/events/client/client.interface';
import { WsException } from '@nestjs/websockets';
import { ClientService } from 'src/events/client/client.service';
import { FriendsService } from 'src/users/friends/friends.service';

@Injectable()
export class GameService {
  private logger: Logger = new Logger(GameService.name);
  private games: Map<string, Game> = new Map();

  constructor(
    private readonly historyService: HistoryService,
    private readonly clientService: ClientService,
    private readonly friendsService: FriendsService,
  ) {}

  init(matchInfo: MatchDto, type: GameType): void {
    const game: Game = {
      gameId: matchInfo.roomId,
      intervalId: null,
      isReady: { p1: false, p2: false },
      players: { p1: matchInfo.p1, p2: matchInfo.p2 },
      spectators: [],
      data: {
        ballPos: { x: 0, y: 0 },
        ballVel: { x: BALL_VEL_INIT_X, y: BALL_VEL_INIT_Y },
        paddlePos: { p1: 0, p2: 0 },
        score: { p1: 0, p2: 0 },
        upPressed: { p1: false, p2: false },
        downPressed: { p1: false, p2: false },
      },
      startTime: new Date(),
      type,
      mode: matchInfo.mode,
    };
    this.games.set(matchInfo.roomId, game);
  }

  ready(server: Namespace, client: Socket, roomId: string) {
    const game = this.games.get(roomId);
    if (!game) {
      throw new WsException('잘못된 게임 준비 요청입니다.');
    }
    const clientSocket = server.sockets.get(client.id);
    clientSocket.join(game.gameId);

    if (game) {
      if (client.id === game.players.p1.id) {
        game.isReady.p1 = true;
      } else if (client.id === game.players.p2.id) {
        game.isReady.p2 = true;
      }
      this.logger.log(
        `room: ${roomId} ready status : ${game.isReady}`,
      );
    }
    if (game.isReady.p1 && game.isReady.p2) {
      server.to(roomId).emit('game_start', game.players);
      this.__game_start(server, game);
    }
  }

  watch(client: Socket, userId: number) {
    const watcher = this.clientService.get(client.id);
    const gamePlayer = this.clientService.getByUserId(userId);

    if (
      !watcher ||
      !gamePlayer ||
      !this.friendsService.isFriend(watcher.user.id, gamePlayer.user.id) ||
      gamePlayer.status !== ClientStatus.INGAME ||
      watcher.status !== ClientStatus.ONLINE
    ) {
      throw new WsException('잘못된 관전 요청입니다.');
    }

    const gameId = this.__find_game(userId);
    if (!gameId) {
      throw new WsException('게임을 찾을 수 없습니다.');
    }
    this.games.get(gameId).spectators.push(watcher);
    client.join(gameId);
  }

  handleKeyPressed(client: Socket, gameInfo: GamePlayDto): void {
    const game = this.games.get(gameInfo.roomId);
    if (client.id === game.players.p1.id) {
      if (gameInfo.keyCode === ARROW_UP) {
        game.data.upPressed.p1 = true;
      } else if (gameInfo.keyCode === ARROW_DOWN) {
        game.data.downPressed.p1 = true;
      }
    } else if (client.id === game.players.p2.id) {
      if (gameInfo.keyCode === ARROW_UP) {
        game.data.upPressed.p2 = true;
      } else if (gameInfo.keyCode === ARROW_DOWN) {
        game.data.downPressed.p2 = true;
      }
    }
  }

  handleKeyReleased(client: Socket, gameInfo: GamePlayDto): void {
    const game = this.games.get(gameInfo.roomId);
    if (client.id === game.players.p1.id) {
      if (gameInfo.keyCode === ARROW_UP) {
        game.data.upPressed.p1 = false;
      } else if (gameInfo.keyCode === ARROW_DOWN) {
        game.data.downPressed.p1 = false;
      }
    } else if (client.id === game.players.p2.id) {
      if (gameInfo.keyCode === ARROW_UP) {
        game.data.upPressed.p2 = false;
      } else if (gameInfo.keyCode === ARROW_DOWN) {
        game.data.downPressed.p2 = false;
      }
    }
  }

  private __find_game(userId: number): string | null {
    const values = this.games.values();
    for (const value of values) {
      if (
        value.players.p1.user.id === userId ||
        value.players.p2.user.id === userId
      ) {
        return value.gameId;
      }
    }
    return null;
  }

  quitGame(server: Namespace, client: Socket): void {
    const pongClient = this.clientService.get(client.id);
    if (!pongClient) {
      return;
    }
    const game = this.games.get(pongClient.room);
    if (!game) {
      return;
    }

    if (game.players.p1.id === pongClient.id) {
      game.data.score.p1 = -1;
    } else if (game.players.p2.id === pongClient.id) {
      game.data.score.p2 = -1;
    }

    server.to(game.gameId).emit('update_score', game.data.score);

    if (game.players.p1.id === pongClient.id) {
      server.to(game.gameId).emit('game_over', game.players.p2);
    } else if (game.players.p2.id === pongClient.id) {
      server.to(game.gameId).emit('game_over', game.players.p1);
    }

    this.__game_end(server, game);
  }

  /* method */

  private __game_start(server: Namespace, game: Game): void {
    this.logger.log(`${game.gameId} game starts`);
    game.intervalId = setInterval(() => {
      this.__single_game_frame(server, game);
    }, 1000 / 60);
  }

  private __game_end(server: Namespace, game: Game): void {
    if (game.intervalId !== null) {
      this.logger.log(`${game.gameId} game ends`);
      clearInterval(game.intervalId);
      game.intervalId = null;

      const history = this.historyService.createHistory(game);
      this.historyService.save(history);

      server.in(game.gameId).socketsLeave(game.gameId);
      server.sockets.get(game.players.p1.id).disconnect();
      server.sockets.get(game.players.p2.id).disconnect();
      this.games.delete(game.gameId);
    }
  }

  private __single_game_frame(server: Namespace, game: Game): void {
    this.__score_check(server, game);
    this.__collid_check(game);
    this.__keyboard_check(game);

    // console.log("updating", game.data.ballPos, game.data.paddlePos)
    server.to(game.gameId).emit('update_game', {
      ballPos: game.data.ballPos,
      paddlePos: game.data.paddlePos,
    });
  }

  private __score_check(server: Namespace, game: Game): void {
    const pos = game.data.ballPos;
    const score = game.data.score;

    if (pos.x <= TABLE_LEFT + BALL_RAD) {
      score.p2 += 1;
      server.to(game.gameId).emit('update_score', score);
      if (score.p2 >= WIN_SCORE) {
        server.to(game.gameId).emit('game_over', game.players.p2);
        this.__game_end(server, game);
      }
    } else if (pos.x >= TABLE_RIGHT - BALL_RAD) {
      score.p1 += 1;
      server.to(game.gameId).emit('update_score', score);
      if (score.p1 >= WIN_SCORE) {
        server.to(game.gameId).emit('game_over', game.players.p1);
        this.__game_end(server, game);
      }
    }
  }

  private __collid_check(game: Game): void {
    this.__wall_collision(game.data);
    this.__paddle_collision(game.players.p1, game);
    this.__paddle_collision(game.players.p2, game);
    game.data.ballPos.x += game.data.ballVel.x;
    game.data.ballPos.y += game.data.ballVel.y;
  }

  private __keyboard_check(game: Game): void {
    const p1_dir: number =
      Number(game.data.downPressed.p1) - Number(game.data.upPressed.p1);
    const p2_dir: number =
      Number(game.data.downPressed.p2) - Number(game.data.upPressed.p2);

    game.data.paddlePos.p1 += PADDLE_SPEED * p1_dir;
    game.data.paddlePos.p2 += PADDLE_SPEED * p2_dir;

    if (game.data.paddlePos.p1 < TABLE_TOP + PADDLE_H / 2)
      game.data.paddlePos.p1 = TABLE_TOP + PADDLE_H / 2;
    else if (game.data.paddlePos.p1 > TABLE_BOTTOM - PADDLE_H / 2)
      game.data.paddlePos.p1 = TABLE_BOTTOM - PADDLE_H / 2;
    if (game.data.paddlePos.p2 < TABLE_TOP + PADDLE_H / 2)
      game.data.paddlePos.p2 = TABLE_TOP + PADDLE_H / 2;
    else if (game.data.paddlePos.p2 > TABLE_BOTTOM - PADDLE_H / 2)
      game.data.paddlePos.p2 = TABLE_BOTTOM - PADDLE_H / 2;
  }

  private __wall_collision(positions: GameData): void {
    const pos = positions.ballPos;
    const vel = positions.ballVel;

    if (pos.x <= TABLE_LEFT + BALL_RAD || pos.x >= TABLE_RIGHT - BALL_RAD) {
      positions.ballPos = { x: 0, y: 0 };
      if (vel.x > 0) vel.x = -BALL_VEL_INIT_X;
      else vel.x = BALL_VEL_INIT_X;
      if (vel.y > 0) vel.y = -BALL_VEL_INIT_Y;
      else vel.y = BALL_VEL_INIT_Y;
    }
    if (pos.y <= TABLE_TOP + BALL_RAD || pos.y >= TABLE_BOTTOM - BALL_RAD)
      vel.y = -vel.y;
  }

  private __paddle_collision(player: PongClient, game: Game): void {
    let center;
    const vel = game.data.ballVel;
    const ball = game.data.ballPos;

    if (player === game.players.p1)
      center = { x: TABLE_LEFT + PADDLE_L, y: game.data.paddlePos.p1 };
    else if (player === game.players.p2)
      center = { x: TABLE_RIGHT - PADDLE_R, y: game.data.paddlePos.p2 };
    else return;
    const rad = PADDLE_W / 2;
    const top = center.y - PADDLE_H / 2 + rad;
    const bot = center.y + PADDLE_H / 2 - rad;
    const left = center.x - PADDLE_W / 2 - BALL_RAD;
    const right = center.x + PADDLE_W / 2 + BALL_RAD;

    if (left <= ball.x && ball.x <= right && top <= ball.y && ball.y <= bot)
      game.data.ballVel = { x: -vel.x, y: vel.y };
    else if (
      this.__circle_collision(
        { x: ball.x, y: ball.y, rad: BALL_RAD },
        { x: center.x, y: top, rad: rad },
      ) ||
      this.__circle_collision(
        { x: ball.x, y: ball.y, rad: BALL_RAD },
        { x: center.x, y: bot, rad: rad },
      )
    )
      game.data.ballVel = { x: -vel.x, y: -vel.y };
    else return;

    game.data.ballVel.x *= ACCEL_RATIO;
    game.data.ballVel.y *= ACCEL_RATIO;
  }

  private __circle_collision(
    c1: { x: number; y: number; rad: number },
    c2: { x: number; y: number; rad: number },
  ): boolean {
    if ((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2 <= (c1.rad + c2.rad) ** 2)
      return true;
    return false;
  }
}
