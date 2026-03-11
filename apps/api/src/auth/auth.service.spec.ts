import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

const mockUser = (): User => {
  const u = new User();
  u.id = 'user-uuid-1';
  u.email = 'alice@example.com';
  u.name = 'Alice';
  u.password = '$2b$12$hashedpassword';
  u.refreshToken = 'valid-refresh-token';
  u.validatePassword = jest.fn();
  return u;
};

const mockTokens = { accessToken: 'access.jwt', refreshToken: 'refresh.jwt' };

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);

    // Default token generation
    jwtService.signAsync
      .mockResolvedValueOnce(mockTokens.accessToken)
      .mockResolvedValueOnce(mockTokens.refreshToken);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── validateUser ─────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      const user = mockUser();
      (user.validatePassword as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser('alice@example.com', 'password123');
      expect(result).toBe(user);
    });

    it('returns null when password is wrong', async () => {
      const user = mockUser();
      (user.validatePassword as jest.Mock).mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser('alice@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('returns null when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('nobody@example.com', 'pass');
      expect(result).toBeNull();
    });
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user, generates tokens, saves refresh token, returns sanitized user + tokens', async () => {
      const user = mockUser();
      usersService.create.mockResolvedValue(user);
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'password123',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        user.id,
        mockTokens.refreshToken,
      );
      expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('generates tokens, saves refresh token, returns sanitized user', async () => {
      const user = mockUser();
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(user);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        user.id,
        mockTokens.refreshToken,
      );
      expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears the refresh token', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      await service.logout('user-uuid-1');
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-uuid-1', null);
    });
  });

  // ─── refreshTokens ────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('returns new tokens when refresh token matches', async () => {
      const user = mockUser();
      usersService.findById.mockResolvedValue(user);
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshTokens(user.id, 'valid-refresh-token');
      expect(result.accessToken).toBe(mockTokens.accessToken);
    });

    it('throws ForbiddenException when user has no stored refresh token', async () => {
      const user = mockUser();
      user.refreshToken = undefined;
      usersService.findById.mockResolvedValue(user);

      await expect(
        service.refreshTokens(user.id, 'some-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when token does not match stored token', async () => {
      const user = mockUser();
      usersService.findById.mockResolvedValue(user);

      await expect(
        service.refreshTokens(user.id, 'tampered-token'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns sanitized user without sensitive fields', async () => {
      usersService.findById.mockResolvedValue(mockUser());
      const result = await service.getMe('user-uuid-1');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result.email).toBe('alice@example.com');
    });
  });
});
