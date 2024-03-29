import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from 'src/users/friends/friends.service';
import { GameService } from './game.service';
import { HistoryService } from './history/history.service';
import { ClientService } from '../events/client/client.service';
describe('GameService', () => {
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: FriendsService, useValue: {} },
        { provide: ClientService, useValue: {} },
        { provide: HistoryService, useValue: {} },
      ],
    }).compile();

    gameService = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(gameService).toBeDefined();
  });
});
