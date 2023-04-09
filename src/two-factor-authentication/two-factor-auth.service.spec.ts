import { Test, TestingModule } from '@nestjs/testing';
import { GeneratedSecret } from 'speakeasy';
import { TwoFactorAuthService } from './two-factor-auth.service';
import * as speakeasy from 'speakeasy';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';

const mockedUserRepository = {
  save: jest.fn(),
};

describe('TwoFactorAuthSercie', () => {
  let twoFactorAuthService: TwoFactorAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        TwoFactorAuthService,
        { provide: getRepositoryToken(User), useValue: mockedUserRepository },
      ],
    }).compile();

    twoFactorAuthService =
      module.get<TwoFactorAuthService>(TwoFactorAuthService);
  });

  describe('register', () => {
    it('user에 secret 저장', async () => {
      // given
      const expected: GeneratedSecret = {
        ascii: 'ascii_test',
        hex: 'hex_test',
        base32: 'base32_test',
        google_auth_qr: 'google auth',
      };
      const mockedUser = new User();
      jest.spyOn(speakeasy, 'generateSecret').mockReturnValueOnce(expected);

      // when
      const actual: GeneratedSecret = twoFactorAuthService.register(mockedUser);

      // then
      expect(actual).toBeDefined();
      expect(actual).toEqual(expected);
      expect(mockedUser.twoFactorSecret).toEqual(expected.ascii);
    });
  });

  describe('verifyTwoFactorAuth', () => {
    it('2차 인증 실패시 401 에러', () => {
      // given
      const secret = 'test';
      const token = '123456';
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      // then
      expect(() => {
        twoFactorAuthService.verifyTwoFactorAuth(secret, token);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('turnOnTwoFactorAuthentication', () => {
    it('2차 인증 사용', () => {
      // given
      const mockedUser = new User();

      // when
      const actual =
        twoFactorAuthService.turnOnTwoFactorAuthentication(mockedUser);

      // then
      expect(actual.isTwoFactorAuthenticationEnabled).toEqual(true);
    });
  });

  describe('turnOffTwoFactorAuthentication', () => {
    it('2차 인증 사용하지 않음', () => {
      // given
      const mockedUser = new User();

      // when
      const actual =
        twoFactorAuthService.turnOffTwoFactorAuthentication(mockedUser);

      // then
      expect(actual.isTwoFactorAuthenticationEnabled).toEqual(false);
    });
  });
});
