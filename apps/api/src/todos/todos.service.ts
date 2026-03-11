import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Todo, TodoStatus } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

interface FindAllOptions {
  userId: string;
  page?: number;
  limit?: number;
  status?: TodoStatus;
  search?: string;
}

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async create(userId: string, createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create({
      ...createTodoDto,
      userId,
      dueDate: createTodoDto.dueDate
        ? new Date(createTodoDto.dueDate)
        : undefined,
    });
    return this.todoRepository.save(todo);
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<{ data: Todo[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(Math.max(1, Number(options.limit) || 20), 100);
    const { userId, status, search } = options;

    const where: FindManyOptions<Todo>['where'] = { userId };

    if (status) {
      (where as any).status = status;
    }

    if (search) {
      (where as any).title = Like(`%${search}%`);
    }

    const [data, total] = await this.todoRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({ where: { id } });

    if (!todo) {
      throw new NotFoundException(`Todo #${id} not found`);
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return todo;
  }

  async update(
    id: string,
    userId: string,
    updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    const todo = await this.findOne(id, userId);

    const updated = this.todoRepository.merge(todo, {
      ...updateTodoDto,
      dueDate: updateTodoDto.dueDate
        ? new Date(updateTodoDto.dueDate)
        : todo.dueDate,
    });

    return this.todoRepository.save(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const todo = await this.findOne(id, userId);
    await this.todoRepository.remove(todo);
  }

  async getStats(userId: string): Promise<Record<string, number>> {
    const todos = await this.todoRepository.find({ where: { userId } });

    return {
      total: todos.length,
      pending: todos.filter((t) => t.status === TodoStatus.PENDING).length,
      in_progress: todos.filter((t) => t.status === TodoStatus.IN_PROGRESS)
        .length,
      completed: todos.filter((t) => t.status === TodoStatus.COMPLETED).length,
    };
  }
}
