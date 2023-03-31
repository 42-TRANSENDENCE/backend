import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { LobbyService } from '../events/lobby/lobby.service';
import { QueueService } from '../events/queue/queue.service';

describe('GameGateway', () => {
  let gameGateway: GameGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameGateway, GameService, LobbyService, QueueService],
    })
      .overrideProvider(GameService)
      .useValue({})
      .overrideProvider(LobbyService)
      .useValue({})
      .overrideProvider(QueueService)
      .useValue({})
      .compile();

    gameGateway = module.get<GameGateway>(GameGateway);
  });

  it('should be defined', () => {
    expect(gameGateway).toBeDefined();
  });
});
