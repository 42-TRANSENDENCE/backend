import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { FriendsService } from 'src/users/friends/friends.service';
import { PlayerService } from '../player/player.service';
import { Namespace, Socket } from 'socket.io';
import {
  CreateFriendlyMatchDto,
  InvitationDto,
  MatchDto,
} from './lobby.interface';
import { GameService } from '../game.service';
import { PlayerStatus } from '../player/player.interface';
import { GameType } from '../game.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LobbyService {
  private logger: Logger = new Logger(LobbyService.name);

  constructor(
    private readonly playerService: PlayerService,
    private readonly friendsService: FriendsService,
    private readonly gameService: GameService,
  ) {}

  invite(server: Namespace, client: Socket, matchInfo: CreateFriendlyMatchDto) {
    const player = this.playerService.get(client.id);
    const otherPlayer = this.playerService.getByUserId(matchInfo.to);

    if (!otherPlayer || otherPlayer.status !== PlayerStatus.WAITING) {
      throw new WsException('현재 게임 초대를 받을 수 없습니다.');
    } else {
      if (!this.friendsService.isFriend(player.user, otherPlayer.user)) {
        throw new WsException(
          '친구가 아닌 상대에게 게임 초대를 보낼 수 없습니다.',
        );
      }
      const roomId = `game_${uuidv4()}`;
      player.room = roomId;
      client.join(roomId);

      const invitation: InvitationDto = {
        from: player,
        to: otherPlayer,
        mode: matchInfo.mode,
        roomId,
      };
      server.sockets.get(otherPlayer.id).emit('invited', invitation);
    }
  }

  refuse(server: Namespace, invitation: InvitationDto) {
    server.in(invitation.roomId).socketsLeave(invitation.roomId);
    const fromSocket = server.sockets.get(invitation.from.id);
    if (!fromSocket) {
      return;
    }
    fromSocket.emit('refused', invitation);
  }

  accept(server: Namespace, client: Socket, invitation: InvitationDto) {
    const p1 = invitation.from;
    const p2 = invitation.to;

    if (
      p1.status !== PlayerStatus.WAITING ||
      p2.status !== PlayerStatus.WAITING
    ) {
      server.to(invitation.roomId).socketsLeave(invitation.roomId);
      throw new WsException('만료된 게임 초대 요청입니다.');
    }

    server.sockets.get(p2.id).join(invitation.roomId);
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
