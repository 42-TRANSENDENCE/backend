import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserStatus } from '../users.entity';
import { UsersService } from '../users.service';
import { Friendship, FriendStatus } from './friendship.entity';
import { FriendsService } from './friends.service';

describe('FriendsService', () => {
  function createRandomUser(): User {
    const user: User = {
      id: faker.datatype.number(),
      nickname: faker.name.firstName(),
      avatar: new Uint8Array([]),
      status: UserStatus.OFFLINE,
      isTwoFactorAuthenticationEnabled: false,
      blocked: [],
      friends: [],
    };
    return user;
  }

  const mockedFriendshipRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockedUsersService = {
    getById: jest.fn(),
    getUserByIdWithBlocked: jest.fn(),
  };

  let friendsService: FriendsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockedFriendshipRepository,
        },
        {
          provide: UsersService,
          useValue: mockedUsersService,
        },
      ],
    }).compile();

    friendsService = module.get<FriendsService>(FriendsService);
  });

  it('should be defined', () => {
    expect(friendsService).toBeDefined();
  });

  const mockedUser: User = {
    id: 42,
    nickname: 'test',
    avatar: new Uint8Array([]),
    status: UserStatus.OFFLINE,
    isTwoFactorAuthenticationEnabled: false,
    blocked: [],
    friends: [],
  };

  const tempUser1 = createRandomUser();
  const tempUser2 = createRandomUser();
  const tempUser3 = createRandomUser();

  const friendship1: Friendship = {
    userId: mockedUser.id,
    user: mockedUser,
    otherUserId: tempUser1.id,
    otherUser: tempUser1,
    status: FriendStatus.APPROVED,
  };
  const friendship2: Friendship = {
    userId: mockedUser.id,
    user: mockedUser,
    otherUserId: tempUser2.id,
    otherUser: tempUser2,
    status: FriendStatus.APPROVED,
  };
  const friendship3: Friendship = {
    userId: mockedUser.id,
    user: mockedUser,
    otherUserId: tempUser3.id,
    otherUser: tempUser3,
    status: FriendStatus.PENDING,
  };

  const mockedFriendship: Friendship[] = [
    friendship1,
    friendship2,
    friendship3,
  ];

  describe('getAllFriends', () => {
    beforeEach(() => {
      mockedFriendshipRepository.find.mockReturnValueOnce([
        friendship1,
        friendship2,
      ]);
    });

    it('should return friends', async () => {
      mockedUsersService.getUserByIdWithBlocked.mockReturnValueOnce(mockedUser);
      const result = await friendsService.getAllFriends(mockedUser.id);

      expect(result.size).toEqual(2);
      expect(result).toContain(tempUser1);
      expect(result).toContain(tempUser2);
    });

    it('should return friends except blocked friends', async () => {
      mockedUser.blocked = [tempUser1];
      mockedUsersService.getUserByIdWithBlocked.mockReturnValueOnce(mockedUser);
      const result = await friendsService.getAllFriends(mockedUser.id);

      expect(result.size).toEqual(1);
      expect(result).toContain(tempUser2);
      mockedUser.blocked = [];
    });
  });

  describe('getPendingRequests', () => {
    beforeEach(() => {
      mockedFriendshipRepository.find.mockReturnValueOnce([friendship3]);
    });

    it('should return not accepted frienship', async () => {
      const result = await friendsService.getPendingRequests(mockedUser);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(1);
      expect(result).toContain(tempUser3);
    });
  });

  describe('deleteRequestedFriendship', () => {
    beforeEach(() => {
      mockedFriendshipRepository.remove.mockImplementationOnce((target) => {
        mockedFriendship.filter((friendship) => {
          friendship !== target;
        });
      });
    });

    it('should delete friendship which status is PENDING', async () => {
      mockedFriendshipRepository.findOne.mockReturnValue(friendship3);
      const result = await friendsService.deleteRequestedFriendship(
        mockedUser,
        tempUser3.id,
      );

      expect(result).toEqual(friendship3);
    });

    it('should throw NotFoundError when friendship does not exist', async () => {
      mockedFriendshipRepository.findOne.mockReturnValue(undefined);
      try {
        await friendsService.deleteRequestedFriendship(
          mockedUser,
          tempUser3.id + 4242,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.message).toBe('requested friendship does not exist');
      }
    });
  });

  describe('approveFriendship', () => {
    it('should approve friendship request', async () => {
      mockedFriendshipRepository.findOne.mockReturnValue(friendship3);
      const result = await friendsService.approveFriendship(
        tempUser3,
        mockedUser.id,
      );
      expect(result.status).toEqual(FriendStatus.APPROVED);
    });

    it('should throw NotFoundException if friendship does not exist', async () => {
      mockedFriendshipRepository.findOne.mockReturnValue(undefined);
      try {
        await friendsService.approveFriendship(mockedUser, tempUser3.id);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.message).toBe("can't find friendship request");
      }
    });
  });
});