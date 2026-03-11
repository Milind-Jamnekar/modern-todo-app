import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

const mockUser = (): User => {
  const u = new User();
  u.id = 'user-uuid-1';
  u.email = 'alice@example.com';
  u.name = 'Alice';
  u.password = 'hashed';
  return u;
};

const mockAuthResponse = () => ({
  user: { id: 'user-uuid-1', email: 'alice@example.com', name: 'Alice' },
  tokens: { accessToken: 'access.jwt', refreshToken: 'refresh.jwt' },
});

const mockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
  getMe: jest.fn(),
  validateUser: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('calls authService.register and returns result', async () => {
      authService.register.mockResolvedValue(mockAuthResponse() as any);
      const result = await controller.register({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'password123',
      });
      expect(authService.register).toHaveBeenCalled();
      expect(result.tokens.accessToken).toBe('access.jwt');
    });
  });

  describe('login', () => {
    it('returns auth response when credentials are valid', async () => {
      authService.validateUser.mockResolvedValue(mockUser());
      authService.login.mockResolvedValue(mockAuthResponse() as any);

      const result = await controller.login({
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(result.tokens.accessToken).toBe('access.jwt');
    });

    it('throws when credentials are invalid', async () => {
      authService.validateUser.mockResolvedValue(null);
      await expect(
        controller.login({ email: 'x@x.com', password: 'wrong' }),
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('calls authService.logout with user id', async () => {
      authService.logout.mockResolvedValue(undefined);
      await controller.logout(mockUser());
      expect(authService.logout).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  describe('getMe', () => {
    it('returns current user profile', async () => {
      authService.getMe.mockResolvedValue({ id: 'user-uuid-1', email: 'alice@example.com', name: 'Alice' } as any);
      const result = await controller.getMe(mockUser());
      expect(result.email).toBe('alice@example.com');
    });
  });
});
