import { Injectable, Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import {
  ACCEL_RATIO,
  ARROW_DOWN,
  ARROW_UP,
  BALL_RAD,
  BALL_VEL_INIT_X,
  BALL_VEL_INIT_Y,
  BALL_MAX_SPEED,
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
import {
  Game,
  GameData,
  GameMode,
  GamePlayDto,
  GameType,
  ReadyDto,
} from './game.interface';
import { HistoryService } from './history/history.service';
import { ClientStatus, PongClient } from 'src/events/client/client.interface';
import { WsException } from '@nestjs/websockets';
import { ClientService } from 'src/events/client/client.service';
import { FriendsService } from 'src/users/friends/friends.service';
import { MatchDto } from 'src/events/dto/match.dto';

@Injectable()
export class GameService {
  private logger: Logger = new Logger(GameService.name);
  private games: Map<string, Game> = new Map();

  constructor(
    private readonly historyService: HistoryService,
    private readonly clientService: ClientService,
    private readonly friendsService: FriendsService,
  ) { }

  init(matchInfo: MatchDto, type: GameType): void {
    const game: Game = {
      gameId: matchInfo.roomId,
      intervalId: null,
      isReady: { p1: false, p2: false },
      players: { p1: null, p2: null },
      users: { p1: matchInfo.p1.user, p2: matchInfo.p2.user },
      spectators: [],
      data: {
        ballPos: { x: 0, y: 0 },
        ballVel: { x: BALL_VEL_INIT_X, y: BALL_VEL_INIT_Y },
        paddlePos: { p1: 0, p2: 0 },
        paddleSize: { p1: PADDLE_H, p2: PADDLE_H },
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

  async ready(server: Namespace, gameClient: Socket, readyInfo: ReadyDto) {
    const user = await this.clientService.getUserFromClient(gameClient);
    const roomId: string = readyInfo.roomId;
    const game = this.games.get(roomId);
    let isPlayer = true;

    if (!game) {
      throw new WsException('잘못된 게임 준비 요청입니다.');
    }

    if (user.id === game.users.p1.id) {
      this.logger.log('player 1 READY');
      game.isReady.p1 = true;
      game.players.p1 = gameClient;
      gameClient.join(roomId);
    } else if (user.id === game.users.p2.id) {
      this.logger.log('player 2 READY');
      game.isReady.p2 = true;
      game.players.p2 = gameClient;
      gameClient.join(roomId);
    } else {
      isPlayer = false;
      const index = game.spectators.indexOf(readyInfo.userId);

      if (index !== -1) {
        game.spectators[index] = gameClient.id;
        gameClient.join(roomId);
      } else {
        return;
      }
    }

    if (game.isReady.p1 && game.isReady.p2) {
      server.to(roomId).emit('game_start', {
        p1Id: game.players.p1?.id,
        p1Name: game.users.p1.nickname,
        p2Name: game.users.p2.nickname,
      });
      gameClient.emit('update_score', game.data.score);
      if (isPlayer) {
        this.__game_start(server, game);
      }
    }
  }

  canWatch(userId: number): string | null | undefined {
    const gameId: string | null = this.__find_game(userId);
    if (gameId === null) return undefined;
    const game: Game = this.games.get(gameId);
    if (game.spectators.length >= 3) {
      return null;
    }
    return game.gameId;
  }

  addSpectator(gameId: string, spectator: PongClient) {
    this.games.get(gameId)?.spectators.push(spectator.id);
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
      if (value.users.p1?.id === userId || value.users.p2?.id === userId) {
        return value.gameId;
      }
    }
    return null;
  }

  private findGameBySocketId(id: string): string | null {
    const values = this.games.values();
    for (const value of values) {
      if (value.players.p1?.id === id || value.players.p2?.id === id) {
        return value.gameId;
      }
    }
  }

  quitGame(server: Namespace, client: Socket): void {
    const gameId = this.findGameBySocketId(client.id);
    if (!gameId) {
      return;
    }
    const game = this.games.get(gameId);

    if (game.players.p1.id === client.id) {
      game.data.score.p1 = -1;
    } else if (game.players.p2.id === client.id) {
      game.data.score.p2 = -1;
    } else {
      // const Stranger: PongClient | null = this.clientService.get(client.id);
      const index: number = game.spectators.indexOf(client.id);
      if (index > -1) {
        game.spectators.splice(index, 1);
        client.leave(game.gameId);
      }
    }

    server.to(game.gameId).emit('update_score', game.data.score);

    if (game.players.p1.id === client.id) {
      server.to(game.gameId).emit('game_over', game.players.p2.id);
    } else if (game.players.p2.id === client.id) {
      server.to(game.gameId).emit('game_over', game.players.p1.id);
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

      if (game.type == GameType.RANK) {
        const history = this.historyService.createHistory(game);
        this.historyService.save(history);
        this.logger.log(
          `winner : ${history.winner.nickname} / loser : ${history.loser.nickname} score : ${history.winnerScore} : ${history.loserScore}`,
        );
      }

      server.in(game.gameId).socketsLeave(game.gameId);
      const Player1 = this.clientService.getByUserId(game.users.p1.id);
      if (Player1) Player1.status = ClientStatus.ONLINE;
      const Player2 = this.clientService.getByUserId(game.users.p2.id);
      if (Player2) Player2.status = ClientStatus.ONLINE;
      this.games.delete(game.gameId);
    }
  }

  private __single_game_frame(server: Namespace, game: Game): void {
    this.__score_check(server, game);
    this.__collid_check(game);
    this.__keyboard_check(game);
    if (game.mode == GameMode.SPECIAL) this.__apply_gravity(game.data);

    server.to(game.gameId).emit('update_game', {
      ballPos: game.data.ballPos,
      paddlePos: game.data.paddlePos,
      paddleSize: game.data.paddleSize,
    });
  }

  private __score_check(server: Namespace, game: Game): void {
    const pos = game.data.ballPos;
    const score = game.data.score;

    if (pos.x <= TABLE_LEFT + BALL_RAD) {
      score.p2 += 1;
      server.to(game.gameId).emit('update_score', score);
      if (game.mode == GameMode.SPECIAL)
        game.data.paddleSize.p2 -= PADDLE_H / (WIN_SCORE + 1);

      if (score.p2 >= WIN_SCORE) {
        server.to(game.gameId).emit('game_over', game.players.p2.id);
        this.__game_end(server, game);
      }
    } else if (pos.x >= TABLE_RIGHT - BALL_RAD) {
      score.p1 += 1;
      server.to(game.gameId).emit('update_score', score);
      if (game.mode == GameMode.SPECIAL)
        game.data.paddleSize.p1 -= PADDLE_H / (WIN_SCORE + 1);

      if (score.p1 >= WIN_SCORE) {
        server.to(game.gameId).emit('game_over', game.players.p1.id);
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
    const p1PaddleH = game.data.paddleSize.p1;
    const p2PaddleH = game.data.paddleSize.p2;
    game.data.paddlePos.p1 += PADDLE_SPEED * p1_dir;
    game.data.paddlePos.p2 += PADDLE_SPEED * p2_dir;

    if (game.data.paddlePos.p1 < TABLE_TOP + p1PaddleH / 2)
      game.data.paddlePos.p1 = TABLE_TOP + p1PaddleH / 2;
    else if (game.data.paddlePos.p1 > TABLE_BOTTOM - p1PaddleH / 2)
      game.data.paddlePos.p1 = TABLE_BOTTOM - p1PaddleH / 2;
    if (game.data.paddlePos.p2 < TABLE_TOP + p2PaddleH / 2)
      game.data.paddlePos.p2 = TABLE_TOP + p2PaddleH / 2;
    else if (game.data.paddlePos.p2 > TABLE_BOTTOM - p2PaddleH / 2)
      game.data.paddlePos.p2 = TABLE_BOTTOM - p2PaddleH / 2;
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
    if (pos.y <= TABLE_TOP + BALL_RAD) {
      vel.y = -vel.y;
      positions.ballPos.y = TABLE_TOP + BALL_RAD + 1;
    }
    if (pos.y >= TABLE_BOTTOM - BALL_RAD) {
      vel.y = -vel.y;
      positions.ballPos.y = TABLE_BOTTOM - BALL_RAD - 1;
    }
  }

  private __paddle_collision(player: Socket, game: Game): void {
    let paddle_center;
    let paddle_size;
    const vel = game.data.ballVel;
    const ball = game.data.ballPos;

    if (player === game.players.p1) {
      paddle_center = { x: TABLE_LEFT + PADDLE_L, y: game.data.paddlePos.p1 };
      paddle_size = game.data.paddleSize.p1;
    } else if (player === game.players.p2) {
      paddle_center = { x: TABLE_RIGHT - PADDLE_R, y: game.data.paddlePos.p2 };
      paddle_size = game.data.paddleSize.p2;
    } else return;

    const rad = PADDLE_W / 2;
    const top = paddle_center.y - PADDLE_H / 2 + rad;
    const bot = paddle_center.y + PADDLE_H / 2 - rad;
    const left = paddle_center.x - PADDLE_W / 2 - BALL_RAD;
    const right = paddle_center.x + PADDLE_W / 2 + BALL_RAD;

    // 평평한 부분에 부딪히는 경우
    if (left <= ball.x && ball.x <= right && top <= ball.y && ball.y <= bot) {
      const speed: number = Math.sqrt(
        game.data.ballVel.x ** 2 + game.data.ballVel.y ** 2,
      );
      const hitPositionRatio: number =
        (game.data.ballPos.y - paddle_center.y) / (paddle_size / 2);
      const reflectRadis: number = (Math.PI / 3) * hitPositionRatio;
      const new_vel_x = Math.cos(reflectRadis) * speed * (vel.x > 0 ? -1 : 1);
      const new_vel_y = Math.sin(reflectRadis) * speed;
      game.data.ballVel = { x: new_vel_x, y: new_vel_y };
      game.data.ballPos.x = player === game.players.p1 ? right + 1 : left - 1;
    } else {
      // 둥근 부분에 부딪히는 경우
      let circle_center: number | undefined;

      if (
        this.__circle_collision(
          { x: ball.x, y: ball.y },
          { x: paddle_center.x, y: top },
        )
      ) {
        circle_center = top;
      } else if (
        this.__circle_collision(
          { x: ball.x, y: ball.y },
          { x: paddle_center.x, y: bot },
        )
      ) {
        circle_center = bot;
      } else {
        return;
      }

      game.data.ballVel = { x: -vel.x, y: -vel.y };
      const dx: number = game.data.ballPos.x - paddle_center.x;
      const dy: number = game.data.ballPos.y - circle_center;
      const R_ratio: number =
        (BALL_RAD + PADDLE_W / 2) / Math.sqrt(dx ** 2 + dy ** 2);

      game.data.ballPos.x = paddle_center.x + dx * R_ratio;
      game.data.ballPos.y = circle_center + dy * R_ratio;
      game.data.ballPos.x += game.data.ballPos.x >= paddle_center ? 1 : -1;
    }
    const new_vel_x: number = game.data.ballVel.x * ACCEL_RATIO;
    const new_vel_y: number = game.data.ballVel.y * ACCEL_RATIO;
    if (new_vel_x ** 2 + new_vel_y ** 2 <= BALL_MAX_SPEED ** 2) {
      game.data.ballVel = { x: new_vel_x, y: new_vel_y };
    }
  }

  private __circle_collision(
    c1: { x: number; y: number },
    c2: { x: number; y: number },
  ): boolean {
    if (
      (c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2 <=
      (BALL_RAD + PADDLE_W / 2) ** 2
    )
      return true;
    return false;
  }

  private __apply_gravity(gameData: GameData) {
    const yPos: number = gameData.ballPos.y;
    if (gameData.ballVel.y >= 20) {
      return;
    } else if (yPos > TABLE_BOTTOM * 0.2) {
      gameData.ballVel.y += 0.2;
    } else if (yPos < TABLE_TOP * 0.2) {
      gameData.ballVel.y -= 0.2;
    }
  }
}
