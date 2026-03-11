import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Todo, TodoPriority, TodoStatus } from './entities/todo.entity';
import { User } from '../users/entities/user.entity';

const USER_ID = 'user-uuid-1';

const mockUser = (): User => {
  const u = new User();
  u.id = USER_ID;
  u.email = 'alice@example.com';
  u.name = 'Alice';
  return u;
};

const makeTodo = (overrides: Partial<Todo> = {}): Todo => {
  const t = new Todo();
  t.id = 'todo-uuid-1';
  t.title = 'Buy groceries';
  t.status = TodoStatus.PENDING;
  t.priority = TodoPriority.MEDIUM;
  t.userId = USER_ID;
  return Object.assign(t, overrides);
};

const mockTodosService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStats: jest.fn(),
});

describe('TodosController', () => {
  let controller: TodosController;
  let todosService: jest.Mocked<TodosService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [{ provide: TodosService, useFactory: mockTodosService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(TodosController);
    todosService = module.get(TodosService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delegates to todosService.create with user id', async () => {
      const todo = makeTodo();
      todosService.create.mockResolvedValue(todo);

      const result = await controller.create(mockUser(), { title: 'Buy groceries' });

      expect(todosService.create).toHaveBeenCalledWith(USER_ID, { title: 'Buy groceries' });
      expect(result.title).toBe('Buy groceries');
    });
  });

  describe('findAll', () => {
    it('passes query params to todosService.findAll', async () => {
      const paginated = { data: [makeTodo()], total: 1, page: 1, limit: 10 };
      todosService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(mockUser(), 1, 10, TodoStatus.PENDING, 'grocer');

      expect(todosService.findAll).toHaveBeenCalledWith({
        userId: USER_ID,
        page: 1,
        limit: 10,
        status: TodoStatus.PENDING,
        search: 'grocer',
      });
      expect(result.total).toBe(1);
    });
  });

  describe('getStats', () => {
    it('returns todo statistics for user', async () => {
      const stats = { total: 4, pending: 2, in_progress: 1, completed: 1 };
      todosService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(mockUser());
      expect(result.total).toBe(4);
    });
  });

  describe('findOne', () => {
    it('delegates to todosService.findOne', async () => {
      const todo = makeTodo();
      todosService.findOne.mockResolvedValue(todo);

      const result = await controller.findOne('todo-uuid-1', mockUser());
      expect(todosService.findOne).toHaveBeenCalledWith('todo-uuid-1', USER_ID);
      expect(result.id).toBe('todo-uuid-1');
    });
  });

  describe('update', () => {
    it('delegates to todosService.update', async () => {
      const todo = makeTodo({ title: 'Updated', status: TodoStatus.IN_PROGRESS });
      todosService.update.mockResolvedValue(todo);

      const result = await controller.update('todo-uuid-1', mockUser(), {
        title: 'Updated',
        status: TodoStatus.IN_PROGRESS,
      });

      expect(todosService.update).toHaveBeenCalledWith('todo-uuid-1', USER_ID, expect.any(Object));
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('delegates to todosService.remove', async () => {
      todosService.remove.mockResolvedValue(undefined);
      await controller.remove('todo-uuid-1', mockUser());
      expect(todosService.remove).toHaveBeenCalledWith('todo-uuid-1', USER_ID);
    });
  });
});
