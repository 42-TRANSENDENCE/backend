import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/users.entity';
import { Player, PlayerStatus } from './player.interface';
import { PlayerService } from './player.service';

const mockedAuthService = {
  getUserFromAuthenticationToken: jest.fn(),
};

describe('PlayerService', () => {
  let playerService: PlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        { provide: AuthService, useValue: mockedAuthService },
      ],
    }).compile();

    playerService = module.get<PlayerService>(PlayerService);
  });

  it('should be defined', () => {
    expect(playerService).toBeDefined();
  });

  const mockedUser: User = {
    id: 42,
    nickname: 'test user',
    avatar: new Uint8Array([]),
    isTwoFactorAuthenticationEnabled: false,
    friends: [],
    acheivements: [],
    histories: [],
  };

  const socketId = '4242';

  const mockedPlayer: Player = {
    id: socketId,
    user: mockedUser,
    status: PlayerStatus.ONLINE,
  };

  describe('add', () => {
    it('should add player to Set', () => {
      playerService.add(mockedPlayer);
      expect(playerService.count()).toEqual(1);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      playerService.add(mockedPlayer);
    });

    it('should delete player from Set', () => {
      playerService.delete(mockedPlayer);
      expect(playerService.count()).toEqual(0);
    });
  });

  describe('get', () => {
    it('should get player from Set', () => {
      playerService.add(mockedPlayer);
      const player = playerService.get(socketId);

      expect(player).toBeDefined();
      expect(player.id).toEqual(socketId);
    });

    it('should return null if player does not exist', () => {
      const player = playerService.get(socketId);

      expect(player).toBeNull();
    });
  });
});
