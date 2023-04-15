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
  private invitations : Map<number, InvitationDto[]> = new Map();
  private logger: Logger = new Logger(LobbyService.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly friendsService: FriendsService,
    private readonly gameService: GameService,
  ) {}

  invite(server: Server, client: Socket, matchInfo: CreateFriendlyMatchDto) {
    const player : PongClient | null = this.clientService.get(client.id);
    const otherPlayer : PongClient | null = this.clientService.getByUserId(matchInfo.to);

    this.logger.log(`초대 이벤트 발생. from ${player.user.nickname} to ${otherPlayer.user.nickname}`);
    
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
        from: player,
        to: otherPlayer,
        mode: matchInfo.mode,
        roomId,
      };

      if (this.invitations.has(matchInfo.to)) {
        this.invitations.get(matchInfo.to).push(invitation);
      } else {
        this.invitations.set(matchInfo.to, [invitation]);
      }
      this.sendAllInvitations(server, otherPlayer.id);
    }
  }

  sendAllInvitations(server : Server, clientSocketId : string) {
    const targetClient : PongClient | null = this.clientService.get(clientSocketId);
    if (targetClient != null) {
      const targetInvitationList : InvitationDto[] | undefined = this.invitations.get(targetClient.user.id);
      if (targetInvitationList)
        server.sockets.sockets.get(clientSocketId).emit('updateInviteList', targetInvitationList);
      else
        server.sockets.sockets.get(clientSocketId).emit('updateInviteList', null);
    }
  }

  cancelInvitation(server : Server, client : Socket, inviteeId : number) {
    this.logger.log(`invitation cancle event occurs. invitee user id : ${inviteeId}`);

    const invitationsList : InvitationDto[] | undefined = this.invitations.get(inviteeId);
    if (invitationsList === undefined) 
      return ;

    for (let i = invitationsList.length - 1; i >= 0; i--) {
      const singleInvitation : InvitationDto = invitationsList[i];
      if (singleInvitation.from.id === client.id) {
        invitationsList.splice(i, 1);
        const inviterClient : PongClient | null = this.clientService.getByUserId(singleInvitation.from.user.id);
        if (inviterClient != null) {
          server.to(inviterClient.id).emit('invitationCanceled');
        }
      }
    }

    const inviteeSocketId : string | undefined = this.clientService.getByUserId(inviteeId)?.id;
    if (inviteeSocketId === undefined)
      return ;
    if (invitationsList.length === 0) {
      this.invitations.delete(inviteeId);
      server.to(inviteeSocketId).emit('updateInviteList', null);
    } else {
      server.to(inviteeSocketId).emit('updateInviteList', invitationsList);
    }
  }

  // cancelAllInvitations(server : Server, client : Socket) {
  // }

  refuse(server: Server, client : Socket, invitation: InvitationDto) {
    this.logger.log(`invitation refused. invitation : ${invitation.from.user.nickname}->${invitation.to.user.nickname}`);

    const invitationsList : InvitationDto[] | undefined = this.invitations.get(invitation.to.user.id);
    if (invitationsList === undefined)
    {
      this.logger.log("No matching list");
      return ;
    }
    this.logger.log("curr invitaion count : ", invitationsList.length);
    for (let i = invitationsList.length - 1; i >= 0; i--) {
      const singleInvitation : InvitationDto = invitationsList[i];

      if (singleInvitation.to.id === client.id) {
        invitationsList.splice(i, 1);
        const inviterClient : PongClient | null = this.clientService.getByUserId(singleInvitation.from.user.id);
        if (inviterClient != null) {
          server.to(inviterClient.id).emit('invitationCanceled');
        }
      }

    }

    const inviteeSocketId : string | undefined = this.clientService.getByUserId(invitation.to.user.id)?.id;
    if (inviteeSocketId === undefined)
      return ;
    if (invitationsList.length === 0) {
      this.invitations.delete(invitation.to.user.id);
      server.to(inviteeSocketId).emit('updateInviteList', null);
    } else {
      server.to(inviteeSocketId).emit('updateInviteList', invitationsList);
    }
  }

  accept(server: Server, client: Socket, invitation: InvitationDto) {
    const p1 = invitation.from;
    const p2 = invitation.to;

    if (
      p1.status !== ClientStatus.ONLINE ||
      p2.status !== ClientStatus.ONLINE
    ) {
      // server.to(invitation.roomId).socketsLeave(invitation.roomId);
      throw new WsException('상대방이 게임을 할 수 없는 상태입니다.');
    }

    p1.room = invitation.roomId;
    p2.room = invitation.roomId;

    const matchInfo: MatchDto = {
      p1,
      p2,
      roomId: invitation.roomId,
      mode: invitation.mode,
    };
    
    this.logger.log(`1v1 matched : ${p1.user.nickname} vs ${p2.user.nickname}`);
    this.logger.log(`game_room ID : ${invitation.roomId}`);
    this.gameService.init(matchInfo, GameType.PRACTICE);
    server.to(p1.id).emit('accepted', matchInfo);
    server.to(p2.id).emit('match_maked', matchInfo);
    p1.status = ClientStatus.INGAME;
    p2.status = ClientStatus.INGAME;
  }
}
