import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameHistory } from './history.entity';
import { HistoryService } from './history.service';
import { User } from 'src/users/users.entity';
import { AchievementService } from 'src/achievement/achievement.service';

const mockedHistoryRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(GameHistory),
          useValue: mockedHistoryRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: AchievementService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
