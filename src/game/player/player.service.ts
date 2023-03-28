import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/users.entity';
import { Player } from './player.interface';
import { parse } from 'cookie';

@Injectable()
export class PlayerService {
  private logger: Logger = new Logger(PlayerService.name);
  private players: Set<Player> = new Set();

  constructor(private readonly authService: AuthService) {}

  add(player: Player): void {
    this.players.add(player);
  }

  delete(player: Player): void {
    this.players.delete(player);
  }

  get(id: string): Player {
    const values = this.players.values();
    for (const player of values) {
      if (player.id === id) {
        return player;
      }
    }
    return null;
  }

  getByUserId(id: number): Player {
    const values = this.players.values();
    for (const player of values) {
      if (player.user.id === id) {
        return player;
      }
    }
    return null;
  }

  count(): number {
    return this.players.size;
  }

  async getUserFromClient(client: Socket): Promise<User> {
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
}
