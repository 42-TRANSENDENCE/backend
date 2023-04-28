import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/users.entity';
import { ChangeStatusDto, PongClient, ClientStatus } from './client.interface';
import { parse } from 'cookie';

@Injectable()
export class ClientService {
  private clients: Set<PongClient> = new Set();

  constructor(private readonly authService: AuthService) {}

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
      if (pongClient.id === id) {
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

  notifyToFriends(
    server: Server,
    user: User,
    friends: User[],
    status: ClientStatus,
  ): void {
    friends.forEach((friend) => {
      const pongClient = this.getByUserId(friend.id);
      if (pongClient) {
        const changeStatusDto: ChangeStatusDto = {
          userId: user.id,
          status,
        };
        server.sockets.sockets
          .get(pongClient.id)
          .emit('change_status', changeStatusDto);
      }
    });
  }
}
