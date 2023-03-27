import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { mockedConfigService } from 'src/utils/mocks/config.service';
import { mockedJwtService } from 'src/utils/mocks/jwt.service';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, ConfigService, JwtService, UsersService],
    })
      .overrideProvider(ConfigService)
      .useValue(mockedConfigService)
      .overrideProvider(JwtService)
      .useValue(mockedJwtService)
      .overrideProvider(UsersService)
      .useValue({})
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
});
