import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Friendship, FriendStatus } from './friendship.entity';
import { FriendsService } from './friends.service';
import { requestNotFoundErr } from './friends.constants';
import { FriendsRepository } from './friends.repository';

describe('FriendsService', () => {
  function createRandomUser(): User {
    const user: User = {
      id: faker.datatype.number(),
      nickname: faker.name.firstName(),
      avatar: new Uint8Array([]),
      isTwoFactorAuthenticationEnabled: false,
      achievements: [],
      wins: [],
      loses: [],
      friends: [],
      channelMember: null,
    };
    return user;
  }

  const mockedFriendshipRepository = {
    findApproved: jest.fn(),
    findOneApproved: jest.fn(),
    findPendingRequests: jest.fn(),
    findOnePendingRequest: jest.fn(),
    findReceived: jest.fn(),
    findOneByIds: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  };

  const mockedUserRepository = {
    findOneBy: jest.fn(),
  };

  let friendsService: FriendsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        {
          provide: FriendsRepository,
          useValue: mockedFriendshipRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockedUserRepository },
      ],
    }).compile();

    friendsService = module.get<FriendsService>(FriendsService);
  });

  it('should be defined', () => {
    expect(friendsService).toBeDefined();
  });

  const mockedUser = createRandomUser();
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

  describe('getAllFriends', () => {
    beforeEach(() => {
      mockedFriendshipRepository.findApproved.mockReturnValueOnce([
        friendship1,
        friendship2,
      ]);
    });

    it('should return friends', async () => {
      const result = await friendsService.getAllFriends(mockedUser);

      expect(result.length).toEqual(2);
      expect(result).toContain(tempUser1);
      expect(result).toContain(tempUser2);
    });
  });

  describe('getPendingRequests', () => {
    beforeEach(() => {
      mockedFriendshipRepository.findPendingRequests.mockReturnValueOnce([
        friendship3,
      ]);
    });

    it('should return not accepted frienship', async () => {
      const result = await friendsService.getPendingRequests(mockedUser);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(1);
      expect(result).toContain(tempUser3);
    });
  });

  describe('deleteRequest', () => {
    it('should delete friendship which status is PENDING', async () => {
      mockedFriendshipRepository.findOnePendingRequest.mockReturnValueOnce(
        friendship3,
      );
      mockedFriendshipRepository.remove.mockReturnValueOnce(friendship3);

      const result = await friendsService.deleteRequest(
        mockedUser.id,
        tempUser3.id,
      );

      expect(result).toEqual(friendship3);
    });

    it('should throw NotFoundError when friendship does not exist', async () => {
      mockedFriendshipRepository.findOnePendingRequest.mockReturnValueOnce(
        undefined,
      );
      try {
        await friendsService.deleteRequest(mockedUser.id, tempUser3.id + 4242);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.message).toBe(requestNotFoundErr);
      }
    });
  });

  describe('approveFriendship', () => {
    it('should approve friendship request', async () => {
      mockedFriendshipRepository.findOnePendingRequest.mockReturnValueOnce(
        friendship3,
      );

      const clone = JSON.parse(JSON.stringify(friendship3));
      clone.status = FriendStatus.APPROVED;
      mockedFriendshipRepository.save.mockReturnValueOnce(clone);
      const result = await friendsService.approveFriendship(
        tempUser3.id,
        mockedUser.id,
      );
      expect(result.status).toEqual(FriendStatus.APPROVED);
    });

    it('should throw NotFoundException if friendship does not exist', async () => {
      mockedFriendshipRepository.findOnePendingRequest.mockReturnValueOnce(
        undefined,
      );

      try {
        await friendsService.approveFriendship(mockedUser.id, tempUser3.id);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.message).toBe(requestNotFoundErr);
      }
    });
  });
});
