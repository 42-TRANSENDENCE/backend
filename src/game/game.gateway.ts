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
import { GamePlayDto } from './game.interface';
import {
  CreateFriendlyMatchDto,
  InvitationDto,
  MatchDto,
  QueueDto,
} from './lobby/lobby.interface';
import { Player, PlayerStatus } from './player/player.interface';
import { LobbyService } from './lobby/lobby.service';
import { PlayerService } from './player/player.service';
import { QueueService } from './queue/queue.service';

@WebSocketGateway({ namespace: '/game' })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger: Logger = new Logger(GameGateway.name);

  @WebSocketServer() server: Namespace;

  constructor(
    private readonly playerService: PlayerService,
    private readonly lobbyService: LobbyService,
    private readonly gameService: GameService,
    private readonly queueService: QueueService,
  ) {}

  afterInit() {
    this.logger.log(`Game Gateway created`);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const user = await this.playerService.getUserFromClient(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    const player: Player = {
      id: client.id,
      user,
      status: PlayerStatus.WAITING,
    };
    this.playerService.add(player);
    this.logger.log(`${user.nickname} connected. client id : ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const player = this.playerService.get(client.id);
    this.logger.log(`${player.user.nickname} disconnected.`);
    this.playerService.delete(player);
    this.queueService.leaveQueue(client);
    this.gameService.quitGame(this.server, client);
  }

  /** Lobby */

  @SubscribeMessage('invite')
  handleInviteEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchInfo: CreateFriendlyMatchDto,
  ): void {
    this.lobbyService.invite(this.server, client, matchInfo);
  }

  @SubscribeMessage('refuse')
  handleRefuseEvent(@MessageBody() invitation: InvitationDto) {
    this.lobbyService.refuse(this.server, invitation);
  }

  @SubscribeMessage('accept')
  handleAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() invitaton: InvitationDto,
  ) {
    this.lobbyService.accept(this.server, client, invitaton);
  }

  @SubscribeMessage('join_queue')
  handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: QueueDto,
  ) {
    this.queueService.joinQueue(this.server, client, data);
  }

  @SubscribeMessage('leave_queue')
  handleLeaveEvent(@ConnectedSocket() client: Socket) {
    this.queueService.leaveQueue(client);
  }

  /** GAME */

  @SubscribeMessage('ready')
  handleReadyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchInfo: MatchDto,
  ) {
    this.gameService.ready(this.server, client, matchInfo);
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

  @SubscribeMessage('watch')
  handleWatchEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    this.gameService.watch(client, userId);
  }
}
