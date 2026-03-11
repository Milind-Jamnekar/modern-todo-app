import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

const mockUser = (): User => {
  const u = new User();
  u.id = 'user-uuid-1';
  u.email = 'alice@example.com';
  u.name = 'Alice';
  u.password = '$2b$12$hashedpassword';
  u.refreshToken = undefined;
  return u;
};

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and returns a new user', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser());
      repo.save.mockResolvedValue(mockUser());

      const result = await service.create({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'password123',
      });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result.email).toBe('alice@example.com');
    });

    it('throws ConflictException when email already exists', async () => {
      repo.findOne.mockResolvedValue(mockUser());

      await expect(
        service.create({ email: 'alice@example.com', name: 'Alice', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── findByEmail ──────────────────────────────────────────────────────────

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser());
      const result = await service.findByEmail('alice@example.com');
      expect(result?.email).toBe('alice@example.com');
    });

    it('returns null when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser());
      const result = await service.findById('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateRefreshToken ───────────────────────────────────────────────────

  describe('updateRefreshToken', () => {
    it('calls update with the new refresh token', async () => {
      repo.update.mockResolvedValue({ affected: 1 } as any);
      await service.updateRefreshToken('user-uuid-1', 'new-token');
      expect(repo.update).toHaveBeenCalledWith('user-uuid-1', { refreshToken: 'new-token' });
    });

    it('sets refreshToken to undefined when null is passed', async () => {
      repo.update.mockResolvedValue({ affected: 1 } as any);
      await service.updateRefreshToken('user-uuid-1', null);
      expect(repo.update).toHaveBeenCalledWith('user-uuid-1', { refreshToken: undefined });
    });
  });
});
