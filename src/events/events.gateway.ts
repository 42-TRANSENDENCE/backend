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
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LobbyService } from 'src/events/lobby/lobby.service';
import { PongClient, ClientStatus } from 'src/events/client/client.interface';
import { ClientService } from 'src/events/client/client.service';
import { FriendsService } from 'src/users/friends/friends.service';
import { User } from 'src/users/users.entity';
import { QueueService } from './queue/queue.service';
import { CreateFriendlyMatchDto } from './dto/create-friendly-match.dto';
import { InvitationDto } from './dto/invitation.dto';
import { QueueDto } from './dto/queue.dto';
import { FriendsStatusDto } from './dto/friends-status.dto';

export interface UserWithStaus extends User {
  status: ClientStatus;
}

@WebSocketGateway()
export class EventGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(EventGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly clientService: ClientService,
    private readonly friendsService: FriendsService,
    private readonly lobbyService: LobbyService,
    private readonly queueService: QueueService,
  ) {}

  afterInit() {
    this.logger.log(`${EventGateway.name} created`);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const user = await this.clientService.getUserFromClient(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    const pongClient = new PongClient(client, user);
    if (!this.clientService.add(pongClient)) {
      client.disconnect(true);
      return;
    }
    this.notify(pongClient, ClientStatus.ONLINE);
    this.logger.log(`${user.nickname} connected. client id : ${client.id}`);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const pongClient = this.clientService.get(client.id);
    if (pongClient) {
      this.logger.log(`${pongClient.user.nickname} disconnected.`);
      this.queueService.leaveQueue(client);
      this.clientService.delete(pongClient);
      this.notify(pongClient, ClientStatus.OFFLINE);
    }
  }

  async notify(pongClient: PongClient, status: ClientStatus) {
    const friends = await this.friendsService.getAllFriends(pongClient.user);
    this.clientService.notifyToFriends(
      this.server,
      pongClient.user,
      friends,
      status,
    );
  }

  @SubscribeMessage('friends_status')
  async handleFriendsStatus(
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<FriendsStatusDto[]>> {
    const user = await this.clientService.getUserFromClient(client);
    const friends: User[] = await this.friendsService.getAllFriends(user);
    const friendsWithStatus: FriendsStatusDto[] = [];

    friends.forEach((friend) => {
      const pongClient = this.clientService.getByUserId(friend.id);
      friendsWithStatus.push(new FriendsStatusDto(pongClient, friend));
    });

    const event = 'friends_status';
    return { event, data: friendsWithStatus };
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

  /** Queue */

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

  /** notify */

  @SubscribeMessage('change_status')
  handleChangeStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() status: ClientStatus,
  ) {
    const pongClient = this.clientService.get(client.id);
    pongClient.status = status;
    this.notify(pongClient, status);
  }

  @SubscribeMessage('getinvitaionlist')
  handleGetInviteListEvent(
    @ConnectedSocket() client: Socket,
  ): void {
    this.lobbyService.sendAllInvitations(this.server, client.id);
  }

  @SubscribeMessage('cancleInvitation')
  handleCancleInvitationEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() inviteeId: number,
  ) : void {
    this.lobbyService.cancelInvitation(this.server, client, inviteeId);
  }
}
