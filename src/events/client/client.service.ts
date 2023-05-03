import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/users.entity';
import { ChangeStatusDto, PongClient, ClientStatus } from './client.interface';
import { FriendsService } from 'src/users/friends/friends.service';
import { parse } from 'cookie';

@Injectable()
export class ClientService {
  private clients: Set<PongClient> = new Set();

  constructor(
    private readonly authService: AuthService,
    private readonly friendsService: FriendsService,
  ) {}

  add(pongClient: PongClient): boolean {
    if (this.getByUserId(pongClient.user.id)) {
      return false;
    }
    this.clients.add(pongClient);
    return true;
  }

  delete(pongClient: PongClient): void {
    this.clients.delete(pongClient);
  }

  get(id: string): PongClient | null {
    const values = this.clients.values();
    for (const pongClient of values) {
      if (pongClient.socket.id === id) {
        return pongClient;
      }
    }
    return null;
  }

  getByUserId(id: number): PongClient | null {
    const values = this.clients.values();
    for (const pongClient of values) {
      if (pongClient.user.id === id) {
        return pongClient;
      }
    }
    return null;
  }

  count(): number {
    return this.clients.size;
  }

  async getUserFromClient(client: Socket): Promise<User> | null {
    try {
      const cookie = client.handshake.headers.cookie;
      const { Authentication: authenticationToken } = parse(cookie);
      const user: User = await this.authService.getUserFromAuthenticationToken(
        authenticationToken,
      );
      return user;
    } catch (err) {
      return null;
    }
  }

  notifyToFriends(user: User, friends: User[], status: ClientStatus): void {
    friends.forEach((friend) => {
      const pongClient = this.getByUserId(friend.id);
      if (pongClient) {
        const changeStatusDto: ChangeStatusDto = {
          userId: user.id,
          status,
        };
        pongClient.socket.emit('change_status', changeStatusDto);
      }
    });
  }

  async notify(pongClient: PongClient, status: ClientStatus) {
    const friends = await this.friendsService.getAllFriends(pongClient.user);
    this.notifyToFriends(pongClient.user, friends, status);
  }

  async emitFriendsRequest(server: Server, client: Socket, friendId: number) {
    const friendClient = this.getByUserId(friendId);
    if (friendClient.status === ClientStatus.ONLINE) {
      friendClient.socket.emit('friends_request', client.id);
    }
  }
}
