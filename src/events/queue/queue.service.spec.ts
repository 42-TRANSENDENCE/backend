import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../../game/game.service';
import { ClientService } from '../client/client.service';
import { QueueService } from './queue.service';
import { AppModule } from 'src/app.module';
import { UsersModule } from 'src/users/users.module';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, UsersModule],
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
