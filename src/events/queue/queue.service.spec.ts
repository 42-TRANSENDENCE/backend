import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../../game/game.service';
import { ClientService } from '../client/client.service';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: ClientService, useValue: {} },
        { provide: GameService, useValue: {} },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
