import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let authController: AuthController;

  const mockedAuthService = {
    getCookieWithJwtAccessToken: jest.fn(),
    getCookieWithJwtRefreshToken: jest.fn(),
    getCookieForLogOut: jest.fn(),
    getFourtyTwoUserInfo: jest.fn(),
  };

  const mockedUsersService = {
    getById: jest.fn(),
    setCurrentRefreshToken: jest.fn(),
    removeRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, UsersService],
    })
      .overrideProvider(AuthService)
      .useValue(mockedAuthService)
      .overrideProvider(UsersService)
      .useValue(mockedUsersService)
      .compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
});
