import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from 'src/users/friends/friends.service';
import { GameService } from '../../game/game.service';
import { ClientService } from '../client/client.service';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
  let lobbyService: LobbyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LobbyService, ClientService, FriendsService, GameService],
    })
      .overrideProvider(ClientService)
      .useValue({})
      .overrideProvider(FriendsService)
      .useValue({})
      .overrideProvider(GameService)
      .useValue({})
      .compile();

    lobbyService = module.get<LobbyService>(LobbyService);
  });

  it('should be defined', () => {
    expect(lobbyService).toBeDefined();
  });
});
