import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TodosService } from './todos.service';
import { Todo, TodoPriority, TodoStatus } from './entities/todo.entity';

const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => {
  const t = new Todo();
  t.id = 'todo-uuid-1';
  t.title = 'Buy groceries';
  t.description = 'Milk and eggs';
  t.status = TodoStatus.PENDING;
  t.priority = TodoPriority.MEDIUM;
  t.userId = USER_ID;
  t.dueDate = undefined;
  t.createdAt = new Date();
  t.updatedAt = new Date();
  return Object.assign(t, overrides);
};

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

describe('TodosService', () => {
  let service: TodosService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: getRepositoryToken(Todo), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(TodosService);
    repo = module.get(getRepositoryToken(Todo));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a todo and returns it', async () => {
      const todo = makeTodo();
      repo.create.mockReturnValue(todo);
      repo.save.mockResolvedValue(todo);

      const result = await service.create(USER_ID, {
        title: 'Buy groceries',
        priority: TodoPriority.MEDIUM,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, title: 'Buy groceries' }),
      );
      expect(result.title).toBe('Buy groceries');
    });

    it('parses dueDate string into a Date object', async () => {
      const todo = makeTodo({ dueDate: new Date('2025-12-31') });
      repo.create.mockReturnValue(todo);
      repo.save.mockResolvedValue(todo);

      await service.create(USER_ID, {
        title: 'Year-end task',
        dueDate: '2025-12-31T00:00:00.000Z',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: expect.any(Date) }),
      );
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated todos for the user', async () => {
      const todos = [makeTodo(), makeTodo({ id: 'todo-uuid-2', title: 'Walk dog' })];
      repo.findAndCount.mockResolvedValue([todos, 2]);

      const result = await service.findAll({ userId: USER_ID, page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('applies correct skip/take for page 2', async () => {
      repo.findAndCount.mockResolvedValue([[], 25]);

      await service.findAll({ userId: USER_ID, page: 2, limit: 10 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('returns empty array when no todos exist', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll({ userId: USER_ID });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the todo when it belongs to the user', async () => {
      repo.findOne.mockResolvedValue(makeTodo());
      const result = await service.findOne('todo-uuid-1', USER_ID);
      expect(result.id).toBe('todo-uuid-1');
    });

    it('throws NotFoundException when todo does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when todo belongs to another user', async () => {
      repo.findOne.mockResolvedValue(makeTodo({ userId: OTHER_USER_ID }));
      await expect(service.findOne('todo-uuid-1', USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('merges and saves the updated todo', async () => {
      const todo = makeTodo();
      const updated = makeTodo({ title: 'Updated title', status: TodoStatus.IN_PROGRESS });
      repo.findOne.mockResolvedValue(todo);
      repo.merge.mockReturnValue(updated);
      repo.save.mockResolvedValue(updated);

      const result = await service.update('todo-uuid-1', USER_ID, {
        title: 'Updated title',
        status: TodoStatus.IN_PROGRESS,
      });

      expect(repo.merge).toHaveBeenCalledWith(todo, expect.objectContaining({ title: 'Updated title' }));
      expect(result.title).toBe('Updated title');
    });

    it('throws NotFoundException when todo does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.update('nonexistent', USER_ID, { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when updating another user\'s todo', async () => {
      repo.findOne.mockResolvedValue(makeTodo({ userId: OTHER_USER_ID }));
      await expect(
        service.update('todo-uuid-1', USER_ID, { title: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes the todo', async () => {
      const todo = makeTodo();
      repo.findOne.mockResolvedValue(todo);
      repo.remove.mockResolvedValue(todo);

      await service.remove('todo-uuid-1', USER_ID);
      expect(repo.remove).toHaveBeenCalledWith(todo);
    });

    it('throws NotFoundException when todo does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('nonexistent', USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when deleting another user\'s todo', async () => {
      repo.findOne.mockResolvedValue(makeTodo({ userId: OTHER_USER_ID }));
      await expect(service.remove('todo-uuid-1', USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correct counts per status', async () => {
      repo.find.mockResolvedValue([
        makeTodo({ status: TodoStatus.PENDING }),
        makeTodo({ status: TodoStatus.PENDING }),
        makeTodo({ status: TodoStatus.IN_PROGRESS }),
        makeTodo({ status: TodoStatus.COMPLETED }),
      ]);

      const stats = await service.getStats(USER_ID);

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.completed).toBe(1);
    });

    it('returns all zeros when user has no todos', async () => {
      repo.find.mockResolvedValue([]);
      const stats = await service.getStats(USER_ID);
      expect(stats).toEqual({ total: 0, pending: 0, in_progress: 0, completed: 0 });
    });
  });
});
