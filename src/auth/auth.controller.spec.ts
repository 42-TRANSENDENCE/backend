import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        {
          provide: getRepositoryToken(User),
          useValue: { findOneBy: jest.fn(), update: jest.fn() },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = await module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
});
