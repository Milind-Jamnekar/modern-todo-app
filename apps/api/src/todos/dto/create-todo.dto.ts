import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TodoPriority } from '../entities/todo.entity';

export class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Milk, eggs, bread' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: TodoPriority, default: TodoPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
