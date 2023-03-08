import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { mockedConfigService } from 'src/utils/mocks/config.service';
import { mockedJwtService } from 'src/utils/mocks/jwt.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const httpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, ConfigService, JwtService, HttpService],
    })
      .overrideProvider(ConfigService)
      .useValue(mockedConfigService)
      .overrideProvider(JwtService)
      .useValue(mockedJwtService)
      .overrideProvider(HttpService)
      .useValue(httpService)
      .compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('create JWT with cookie', () => {
    it('access token cookie should be undefined', () => {
      const id = 42;
      expect(authService.getCookieWithJwtAccessToken(id)).toBeDefined();
    });

    it('refresh token cookie should be undefined', () => {
      const id = 42;
      expect(authService.getCookieWithJwtRefreshToken(id)).toBeDefined();
    });

    it('cookie for log out shoule be defined', () => {
      expect(authService.getCookieForLogOut()).toBeDefined();
    });
  });

  describe('get 42 user API', () => {
    let token;
    let userInfo;

    beforeEach(() => {
      token = '42 API access token';
      userInfo = { name: 'minjkim2', id: 4242 };
      httpService.get.mockReturnValueOnce(of({ data: userInfo }));
    });

    it('should be defined', async () => {
      const actual = await authService.getFourtyTwoUserInfo(token);
      expect(actual).toBeDefined();
    });

    it('should be equal to original user info', async () => {
      const actual = await authService.getFourtyTwoUserInfo(token);
      expect(actual).toEqual(userInfo);
    });
  });
});
