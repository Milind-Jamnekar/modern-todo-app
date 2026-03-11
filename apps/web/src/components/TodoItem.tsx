'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Pencil,
  ChevronDown,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Todo } from '@repo/types';
import { TodoStatus, TodoPriority } from '@repo/types';
import { useUpdateTodo, useDeleteTodo } from '@/hooks/useTodos';
import { TodoForm } from './TodoForm';

const STATUS_CONFIG = {
  [TodoStatus.PENDING]: {
    icon: Circle,
    label: 'Pending',
    next: TodoStatus.IN_PROGRESS,
    nextLabel: 'Mark In Progress',
    iconClass: 'text-muted-foreground hover:text-foreground',
  },
  [TodoStatus.IN_PROGRESS]: {
    icon: Clock,
    label: 'In Progress',
    next: TodoStatus.COMPLETED,
    nextLabel: 'Mark Complete',
    iconClass: 'text-blue-500 dark:text-blue-400',
  },
  [TodoStatus.COMPLETED]: {
    icon: CheckCircle2,
    label: 'Completed',
    next: TodoStatus.PENDING,
    nextLabel: 'Mark Pending',
    iconClass: 'text-emerald-500 dark:text-emerald-400',
  },
};

const PRIORITY_BADGE: Record<TodoPriority, React.ComponentProps<typeof Badge>['variant']> = {
  [TodoPriority.LOW]: 'secondary',
  [TodoPriority.MEDIUM]: 'warning',
  [TodoPriority.HIGH]: 'destructive',
};

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const config = STATUS_CONFIG[todo.status];
  const StatusIcon = config.icon;

  const handleStatusCycle = () => {
    updateTodo.mutate({ id: todo.id, payload: { status: config.next } });
  };

  const handleDelete = () => {
    if (window.confirm('Delete this todo?')) {
      deleteTodo.mutate(todo.id);
    }
  };

  const isOverdue =
    todo.dueDate && todo.status !== TodoStatus.COMPLETED && new Date(todo.dueDate) < new Date();
  const isCompleted = todo.status === TodoStatus.COMPLETED;

  return (
    <>
      <Card
        className={cn(
          'group border-border/50 transition-all duration-200 hover:shadow-md hover:border-border',
          isCompleted && 'opacity-70',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Status toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'mt-0.5 h-6 w-6 shrink-0 rounded-full p-0 transition-transform hover:scale-110',
                    config.iconClass,
                  )}
                  onClick={handleStatusCycle}
                  disabled={updateTodo.isPending}
                >
                  <StatusIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{config.nextLabel}</TooltipContent>
            </Tooltip>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium leading-tight',
                    isCompleted && 'line-through text-muted-foreground',
                  )}
                >
                  {todo.title}
                </span>
                <Badge variant={PRIORITY_BADGE[todo.priority]} className="h-5 text-[10px] px-1.5">
                  {todo.priority}
                </Badge>
              </div>

              {todo.description && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown
                    className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
                  />
                  {expanded ? 'Hide' : 'Show'} description
                </button>
              )}

              {expanded && todo.description && (
                <p className="text-xs text-muted-foreground leading-relaxed animate-fade-in border-l-2 border-border pl-3 py-0.5">
                  {todo.description}
                </p>
              )}

              {todo.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isOverdue
                      ? 'text-destructive font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {isOverdue && 'Overdue · '}
                  {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                </div>
              )}
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStatusCycle}>
                  <StatusIcon />
                  {config.nextLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteTodo.isPending}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {isEditing && <TodoForm todo={todo} onClose={() => setIsEditing(false)} />}
    </>
  );
}
