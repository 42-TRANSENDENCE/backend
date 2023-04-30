import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { FriendsService } from 'src/users/friends/friends.service';
import { Server, Socket } from 'socket.io';
import { GameService } from '../../game/game.service';
import { GameType } from '../../game/game.interface';
import { v4 as uuidv4 } from 'uuid';
import { ClientStatus, PongClient } from '../client/client.interface';
import { ClientService } from '../client/client.service';
import { CreateFriendlyMatchDto } from '../dto/create-friendly-match.dto';
import { InvitationDto } from '../dto/invitation.dto';
import { MatchDto } from '../dto/match.dto';

@Injectable()
export class LobbyService {
  private invitations: Map<number, InvitationDto[]> = new Map();
  private logger: Logger = new Logger(LobbyService.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly friendsService: FriendsService,
    private readonly gameService: GameService,
  ) {}

  invite(server: Server, client: Socket, matchInfo: CreateFriendlyMatchDto) {
    const player: PongClient | null = this.clientService.get(client.id);
    const otherPlayer: PongClient | null = this.clientService.getByUserId(
      matchInfo.to,
    );

    this.logger.log(
      `초대 이벤트 발생. from ${player.user.nickname} to ${otherPlayer.user.nickname}`,
    );

    if (!otherPlayer || otherPlayer.status !== ClientStatus.ONLINE) {
      throw new WsException('현재 게임 초대를 받을 수 없습니다.');
    } else {
      if (!this.friendsService.isFriend(player.user.id, otherPlayer.user.id)) {
        throw new WsException(
          '친구가 아닌 상대에게 게임 초대를 보낼 수 없습니다.',
        );
      }
      const roomId = `game_${uuidv4()}`;

      const invitation: InvitationDto = {
        from: player.user,
        to: otherPlayer.user,
        mode: matchInfo.mode,
        roomId,
      };

      if (this.invitations.has(matchInfo.to)) {
        this.invitations.get(matchInfo.to).push(invitation);
      } else {
        this.invitations.set(matchInfo.to, [invitation]);
      }
      this.sendAllInvitations(server, otherPlayer.socket);
    }
  }

  sendAllInvitations(server: Server, clientSocket: Socket) {
    const targetClient: PongClient | null = this.clientService.get(
      clientSocket.id,
    );

    if (targetClient != null) {
      const targetInvitationList: InvitationDto[] | undefined =
        this.invitations.get(targetClient.user.id);
      if (targetInvitationList) {
        clientSocket.emit('updateInviteList', targetInvitationList);
      } else {
        clientSocket.emit('updateInviteList', null);
      }
    }
  }

  cancelInvitation(server: Server, client: Socket, inviteeId: number) {
    this.logger.log(
      `invitation cancle event occurs. invitee user id : ${inviteeId}`,
    );

    const invitationsList: InvitationDto[] | undefined =
      this.invitations.get(inviteeId);
    if (invitationsList === undefined) return;

    for (let i = invitationsList.length - 1; i >= 0; i--) {
      const singleInvitation: InvitationDto = invitationsList[i];

      const inviterClientSocket: Socket | null = this.clientService.getByUserId(
        singleInvitation.from.id,
      ).socket;
      if (inviterClientSocket && inviterClientSocket.id === client.id) {
        invitationsList.splice(i, 1);
        inviterClientSocket.emit('invitationCanceled');
      }
    }

    const inviteeClientSocket: Socket =
      this.clientService.getByUserId(inviteeId).socket;
    if (inviteeClientSocket.id === undefined) return;
    if (invitationsList.length === 0) {
      this.invitations.delete(inviteeId);
      inviteeClientSocket.emit('updateInviteList', null);
    } else {
      inviteeClientSocket.emit('updateInviteList', invitationsList);
    }
  }

  refuse(server: Server, client: Socket, invitation: InvitationDto) {
    this.logger.log(
      `invitation refused. invitation : ${invitation.from.nickname}->${invitation.to.nickname}`,
    );

    const invitationsList: InvitationDto[] | undefined = this.invitations.get(
      invitation.to.id,
    );
    if (invitationsList === undefined) {
      this.logger.log('No matching list');
      return;
    }
    this.logger.log('curr invitaion count : ', invitationsList.length);
    for (let i = invitationsList.length - 1; i >= 0; i--) {
      const singleInvitation: InvitationDto = invitationsList[i];

      const inviterClientSocket: Socket | null = this.clientService.getByUserId(
        singleInvitation.from.id,
      ).socket;

      if (inviterClientSocket && inviterClientSocket.id === client.id) {
        invitationsList.splice(i, 1);
        inviterClientSocket.emit('invitationCanceled');
      }
    }

    const inviteeClientSocket: Socket | null = this.clientService.getByUserId(
      invitation.to.id,
    ).socket;

    if (inviteeClientSocket === null) {
      return;
    }
    if (invitationsList.length === 0) {
      this.invitations.delete(invitation.to.id);
      inviteeClientSocket.emit('updateInviteList', null);
    } else {
      inviteeClientSocket.emit('updateInviteList', invitationsList);
    }
  }

  accept(server: Server, client: Socket, invitation: InvitationDto) {
    const p1: PongClient = this.clientService.getByUserId(invitation.from.id);
    const p2: PongClient = this.clientService.getByUserId(invitation.to.id);
    const roomId = invitation.roomId;
    const mode = invitation.mode;

    if (
      p1.status !== ClientStatus.ONLINE ||
      p2.status !== ClientStatus.ONLINE
    ) {
      // server.to(invitation.roomId).socketsLeave(invitation.roomId);
      throw new WsException('상대방이 게임을 할 수 없는 상태입니다.');
    }

    p1.room = roomId;
    p2.room = roomId;

    const matchInfo: MatchDto = {
      p1,
      p2,
      roomId,
      mode,
    };

    this.logger.log(`1v1 matched : ${p1.user.nickname} vs ${p2.user.nickname}`);
    this.logger.log(`game_room ID : ${invitation.roomId}`);
    this.gameService.init(matchInfo, GameType.PRACTICE);
    p1.socket.emit('accepted', { roomId, mode });
    p2.socket.emit('match_maked', { roomId, mode });
  }

  spectate(server: Server, client: Socket, playerId: number) {
    this.logger.log(`관전 시도 이벤트 발생 to , ${playerId}`);
    const roomId: string | null | undefined =
      this.gameService.canWatch(playerId);
    console.log('canWatch ret : ', roomId);
    if (roomId === undefined)
      client.emit('spectate', { roomId: null, msg: '잘못 된 관전 시도' });
    else if (roomId === null)
      client.emit('spectate', {
        roomId: null,
        msg: '최대 3명까지 관전 가능합니다.',
      });
    else {
      this.gameService.addSpectator(roomId, this.clientService.get(client.id));
      client.emit('spectate', { roomId: roomId, msg: '' });
    }
  }
}
