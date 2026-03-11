import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TodoStatus } from './entities/todo.entity';

@ApiTags('todos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  create(@CurrentUser() user: User, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(user.id, createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TodoStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: TodoStatus,
    @Query('search') search?: string,
  ) {
    return this.todosService.findAll({ userId: user.id, page, limit, status, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get todo statistics' })
  getStats(@CurrentUser() user: User) {
    return this.todosService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single todo' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.todosService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(id, user.id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a todo' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.todosService.remove(id, user.id);
  }
}
