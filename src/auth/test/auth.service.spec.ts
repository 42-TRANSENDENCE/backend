import { BullModule, getQueueToken } from '@nestjs/bull';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { mockedConfigService } from 'src/utils/mocks/config.service';
import { mockedJwtService } from 'src/utils/mocks/jwt.service';
import { AuthService } from '../auth.service';
import { FourtyTwoToken } from '../interface/fourty-two-token.interface';

const mockedLoginQueue = {
  add: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: 'fourtyTwoLogin',
          limiter: { max: 1, duration: 1000 },
        }),
      ],
      providers: [AuthService, ConfigService, JwtService],
    })
      .overrideProvider(getQueueToken('fourtyTwoLogin'))
      .useValue(mockedLoginQueue)
      .overrideProvider(ConfigService)
      .useValue(mockedConfigService)
      .overrideProvider(JwtService)
      .useValue(mockedJwtService)
      .compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('create cookie with JWT', () => {
    const id = 42;
    const accessTokenExpirationTime = mockedConfigService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );
    const refreshTokenExpirationTime = mockedConfigService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );

    it('access token cookie should valid', () => {
      const result = authService.getCookieWithJwtAccessToken(id);

      expect(result).toBeDefined();
      expect(result).toMatch(/Authentication=.+;/);
      expect(result).toMatch(/HttpOnly; Path=\/;/);
      expect(result).toMatch(
        new RegExp(`Max-Age=${accessTokenExpirationTime}`),
      );
    });

    it('refresh token cookie should valid', () => {
      const result = authService.getCookieWithJwtRefreshToken(id);

      expect(result.refreshCookie).toBeDefined();
      expect(result.refreshCookie).toMatch(/Refresh=.+;/);
      expect(result.refreshCookie).toMatch(/HttpOnly; Path=\/;/);
      expect(result.refreshCookie).toMatch(
        new RegExp(`Max-Age=${refreshTokenExpirationTime}`),
      );
    });
  });

  describe('get cookie for logout', () => {
    it('should return an array of cookies for logout', () => {
      const result = authService.getCookieForLogOut();

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toMatch(/Authentication=;/);
      expect(result[1]).toMatch(/Refresh=;/);
    });
  });

  describe('getFourtyTwoUser', () => {
    const token: FourtyTwoToken = {
      access_token: 'access token',
      refresh_token: 'refresh token',
      created_at: 4242,
      expires_in: 424242,
      scope: 'public',
      token_type: 'Bearer',
    };

    const user = { id: 4242, name: 'minjkim2' };

    it('should return user data from 42 API', async () => {
      const mockJob = {
        finished: jest.fn().mockResolvedValueOnce(user),
      };
      jest.spyOn(mockedLoginQueue, 'add').mockResolvedValueOnce(mockJob);

      const result = await authService.getFourtyTwoUser(token);

      expect(result).toBeDefined();
      expect(result).toBe(user);
      expect(mockedLoginQueue.add).toBeCalledWith('userInfo', { token });
      expect(mockJob.finished).toBeCalledTimes(1);
    });

    it('should throw error when job has error', () => {
      const error = new UnauthorizedException('42 Authorization failed');

      const mockJob = {
        finished: jest.fn().mockImplementation(() => {
          throw new Error();
        }),
      };
      jest.spyOn(mockedLoginQueue, 'add').mockResolvedValueOnce(mockJob);

      expect(authService.getFourtyTwoUser(token)).rejects.toThrow(error);
    });
  });
});
