import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { mockedConfigService } from 'src/utils/mocks/config.service';
import { FourtyTwoToken } from '../interface/fourty-two-token.interface';
import { User, UserStatus } from 'src/users/users.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/users.dto';
import { LoginService } from '../login.service';
import { faker } from '@faker-js/faker';

const mockedAuthService = {
  getCookieWithJwtAccessToken: jest.fn(),
  getCookieWithJwtRefreshToken: jest.fn(),
  getCookieForLogOut: jest.fn(),
};

const mockedUsersService = {
  getById: jest.fn(),
  setCurrentRefreshToken: jest.fn(() => {
    return;
  }),
  create: jest.fn(),
  removeRefreshToken: jest.fn(),
};

const mockedLoginService = {
  oauthLogin: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockedAuthService },
        { provide: UsersService, useValue: mockedUsersService },
        { provide: ConfigService, useValue: mockedConfigService },
        { provide: LoginService, useValue: mockedLoginService },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  const mockedUser: User = {
    id: faker.datatype.number(),
    nickname: 'john',
    avatar: new Uint8Array([0, 1, 2]),
    isTwoFactorAuthenticationEnabled: false,
    achievements: [],
    friends: [],
    wins: [],
    loses: [],
    bannedChannels: [],
    memberchannels: [],
  };

  const mockedFourtyTwoUser = {
    id: 42,
    image: { link: 'url' },
  };

  const token: FourtyTwoToken = {
    access_token: 'access token',
    refresh_token: 'refresh token',
    created_at: 4242,
    expires_in: 424242,
    scope: 'public',
    token_type: 'Bearer',
  };

  describe('login', () => {
    const mockedReq = {
      res: {
        setHeader: jest.fn(),
      },
      session: {
        info: {},
      },
    };

    beforeEach(() => {
      mockedLoginService.oauthLogin.mockReturnValue(mockedFourtyTwoUser);
      mockedAuthService.getCookieWithJwtAccessToken.mockReturnValue(
        'access cookie',
      );
      mockedAuthService.getCookieWithJwtRefreshToken.mockReturnValue({
        refreshToken: 'refresh token',
        refreshCookie: 'refresh cookie',
      });

      mockedUsersService.getById.mockReturnValue(mockedUser);
    });

    it('should redirect to home if user already exists and user is not using 2FA', async () => {
      const result = await authController.login(mockedReq, token);
      const expected = {
        url: `${mockedConfigService.get('FRONTEND_URL')}/home`,
      };
      expect(result).toEqual(expected);
    });

    it('should redirect to twofactor if user using 2FA', async () => {
      mockedUser.isTwoFactorAuthenticationEnabled = true;
      const result = await authController.login(mockedReq, token);
      const expected = {
        url: `${mockedConfigService.get('FRONTEND_URL')}/twofactor`,
      };
      expect(result).toEqual(expected);
    });

    it('should redirect to signup if user not exist', async () => {
      mockedUsersService.getById.mockImplementationOnce(() => {
        throw new NotFoundException('user not exist');
      });
      const result = await authController.login(mockedReq, token);
      const expected = {
        url: `${mockedConfigService.get('FRONTEND_URL')}/signup`,
      };
      expect(result).toEqual(expected);
      expect(mockedReq.session.info).toEqual({
        id: mockedFourtyTwoUser.id,
        link: mockedFourtyTwoUser.image.link,
      });
    });
  });

  describe('signup', () => {
    const mockedUserDto: CreateUserDto = {
      nickname: 'test user',
    };

    const mockedReq = {
      sessionInfo: {
        id: 42,
        nickname: 'test user',
        link: 'test url',
      },
      body: mockedUserDto,
      res: {
        setHeader: jest.fn(),
      },
      session: {
        destroy: jest.fn(),
      },
    };

    beforeEach(() => {
      mockedUsersService.create.mockImplementationOnce(
        (id: number, nickname: string, link: string) => {
          const user = new User();
          user.id = id;
          user.nickname = nickname;
          user.avatar = new Uint8Array([]);
          return user;
        },
      );
    });

    it('should create user', async () => {
      const user = new User();
      user.id = mockedReq.sessionInfo.id;
      user.nickname = mockedUserDto.nickname;
      user.avatar = new Uint8Array([]);

      const result = await authController.signUp(
        mockedReq,
        mockedUserDto,
        mockedReq.sessionInfo,
      );
      expect(result).toEqual(user);
    });
  });
});
