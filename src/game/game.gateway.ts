import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { Socket } from 'socket.io';
import { GameService } from './game.service';
import { GamePlayDto, ReadyDto } from './game.interface';

@WebSocketGateway({ namespace: '/game' })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger: Logger = new Logger(GameGateway.name);

  @WebSocketServer() server: Namespace;

  constructor(private readonly gameService: GameService) {}

  afterInit() {
    this.logger.log(`Game Gateway created`);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`client: ${client.id} connected`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`client: ${client.id} disconnected`);
    this.gameService.quitGame(this.server, client);
  }

  /** GAME */

  @SubscribeMessage('watch')
  handleWatchEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    this.gameService.watch(client, userId);
  }

  @SubscribeMessage('ready')
  handleReadyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() readyInfo: ReadyDto,
  ) {
    this.gameService.ready(this.server, client, readyInfo);
  }

  @SubscribeMessage('keypress')
  handleKeyPressed(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameInfo: GamePlayDto,
  ) {
    this.gameService.handleKeyPressed(client, gameInfo);
  }

  @SubscribeMessage('keyrelease')
  handleKeyReleased(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameInfo: GamePlayDto,
  ) {
    this.gameService.handleKeyReleased(client, gameInfo);
  }
}
