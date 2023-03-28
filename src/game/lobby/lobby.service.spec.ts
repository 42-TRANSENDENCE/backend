import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from 'src/users/friends/friends.service';
import { GameService } from '../game.service';
import { PlayerService } from '../player/player.service';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
  let lobbyService: LobbyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LobbyService, PlayerService, FriendsService, GameService],
    })
      .overrideProvider(PlayerService)
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
