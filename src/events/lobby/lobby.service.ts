import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { FriendsService } from 'src/users/friends/friends.service';
import { Server, Socket } from 'socket.io';
import {
  CreateFriendlyMatchDto,
  InvitationDto,
  MatchDto,
} from './lobby.interface';
import { GameService } from '../../game/game.service';
import { GameType } from '../../game/game.interface';
import { v4 as uuidv4 } from 'uuid';
import { ClientStatus } from '../client/client.interface';
import { ClientService } from '../client/client.service';

@Injectable()
export class LobbyService {
  private logger: Logger = new Logger(LobbyService.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly friendsService: FriendsService,
    private readonly gameService: GameService,
  ) {}

  invite(server: Server, client: Socket, matchInfo: CreateFriendlyMatchDto) {
    const player = this.clientService.get(client.id);
    const otherPlayer = this.clientService.getByUserId(matchInfo.to);

    if (!otherPlayer || otherPlayer.status !== ClientStatus.ONLINE) {
      throw new WsException('현재 게임 초대를 받을 수 없습니다.');
    } else {
      if (!this.friendsService.isFriend(player.user.id, otherPlayer.user.id)) {
        throw new WsException(
          '친구가 아닌 상대에게 게임 초대를 보낼 수 없습니다.',
        );
      }
      const roomId = `game_${uuidv4()}`;
      player.room = roomId;

      const invitation: InvitationDto = {
        from: player,
        to: otherPlayer,
        mode: matchInfo.mode,
        roomId,
      };
      server.sockets.sockets.get(otherPlayer.id).emit('invited', invitation);
    }
  }

  refuse(server: Server, invitation: InvitationDto) {
    server.in(invitation.roomId).socketsLeave(invitation.roomId);
    const fromSocket = server.sockets.sockets.get(invitation.from.id);
    if (!fromSocket) {
      return;
    }
    fromSocket.emit('refused', invitation);
  }

  accept(server: Server, client: Socket, invitation: InvitationDto) {
    const p1 = invitation.from;
    const p2 = invitation.to;

    if (
      p1.status !== ClientStatus.ONLINE ||
      p2.status !== ClientStatus.ONLINE
    ) {
      server.to(invitation.roomId).socketsLeave(invitation.roomId);
      throw new WsException('상대방이 게임을 할 수 없는 상태입니다.');
    }

    p2.room = invitation.roomId;

    const matchInfo: MatchDto = {
      p1,
      p2,
      roomId: invitation.roomId,
      mode: invitation.mode,
    };
    server.to(invitation.roomId).emit('match_maked', matchInfo);
    this.gameService.init(matchInfo, GameType.PRACTICE);
  }
}
