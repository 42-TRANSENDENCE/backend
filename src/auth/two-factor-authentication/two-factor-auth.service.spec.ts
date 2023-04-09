import { Test, TestingModule } from '@nestjs/testing';
import { GeneratedSecret } from 'speakeasy';
import { UsersService } from 'src/users/users.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import * as speakeasy from 'speakeasy';
import { Logger, UnauthorizedException } from '@nestjs/common';

const mockedUsersService = {
  setTwoFactorAuthenticationSecret: jest.fn(),
};

describe('TwoFactorAuthSercie', () => {
  let twoFactorAuthService: TwoFactorAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [UsersService, TwoFactorAuthService],
    })
      .overrideProvider(UsersService)
      .useValue(mockedUsersService)
      .compile();

    twoFactorAuthService =
      module.get<TwoFactorAuthService>(TwoFactorAuthService);
  });

  describe('register', () => {
    it('should generate a secret and call the users service', async () => {
      const id = 42;
      const secret: GeneratedSecret = {
        ascii: 'ascii_test',
        hex: 'hex_test',
        base32: 'base32_test',
        google_auth_qr: 'google auth',
      };
      jest.spyOn(speakeasy, 'generateSecret').mockReturnValue(secret);

      const setTwoFactorAuthenticationSecretSpy = jest
        .spyOn(mockedUsersService, 'setTwoFactorAuthenticationSecret')
        .mockReturnValue(null);
      const result: GeneratedSecret = await twoFactorAuthService.register(id);

      expect(result).toBeDefined();
      expect(result).toEqual(secret);
      expect(setTwoFactorAuthenticationSecretSpy).toHaveBeenCalledWith(
        id,
        secret.ascii,
      );
    });
  });

  describe('verifyTwoFactorAuth', () => {
    const secret = 'test secret';
    const token = '123456';
    const error = new UnauthorizedException('two factor authentication fail');

    it('should return true if token is verified', () => {
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      expect(twoFactorAuthService.verifyTwoFactorAuth(secret, token)).toEqual(
        true,
      );
    });

    it('should be throw UnauthorizedException if token is not verifed', () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      expect(() => {
        twoFactorAuthService.verifyTwoFactorAuth(secret, token);
      }).toThrowError(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(`2FA Failed token: ${token}`);
    });
  });
});
