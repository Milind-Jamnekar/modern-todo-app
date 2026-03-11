'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTodo, useUpdateTodo } from '@/hooks/useTodos';
import type { Todo } from '@repo/types';
import { TodoPriority } from '@repo/types';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.nativeEnum(TodoPriority).default(TodoPriority.MEDIUM),
  dueDate: z.string().optional(),
});

type TodoFormValues = z.infer<typeof todoSchema>;

interface TodoFormProps {
  todo?: Todo;
  onClose: () => void;
}

export function TodoForm({ todo, onClose }: TodoFormProps) {
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const isEditing = !!todo;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: todo?.title ?? '',
      description: todo?.description ?? '',
      priority: todo?.priority ?? TodoPriority.MEDIUM,
      dueDate: todo?.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
    },
  });

  const priority = watch('priority');

  useEffect(() => {
    if (createTodo.isSuccess || updateTodo.isSuccess) {
      onClose();
      reset();
    }
  }, [createTodo.isSuccess, updateTodo.isSuccess, onClose, reset]);

  const onSubmit = (values: TodoFormValues) => {
    const payload = {
      ...values,
      description: values.description || undefined,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
    };
    if (isEditing) {
      updateTodo.mutate({ id: todo.id, payload });
    } else {
      createTodo.mutate(payload);
    }
  };

  const isPending = createTodo.isPending || updateTodo.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Todo' : 'Create Todo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              autoFocus
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Add more details (optional)"
              className="resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue('priority', v as TodoPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TodoPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TodoPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TodoPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('dueDate')}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
