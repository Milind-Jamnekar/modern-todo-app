'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchTodos,
  fetchTodoStats,
  createTodo,
  updateTodo,
  deleteTodo,
} from '@/lib/todos';
import type { CreateTodoRequest, UpdateTodoRequest, TodoStatus } from '@repo/types';

interface UseTodosOptions {
  page?: number;
  limit?: number;
  status?: TodoStatus;
  search?: string;
}

export const TODOS_QUERY_KEY = ['todos'];
export const STATS_QUERY_KEY = ['todos', 'stats'];

export function useTodos(options: UseTodosOptions = {}) {
  return useQuery({
    queryKey: [...TODOS_QUERY_KEY, options],
    queryFn: () => fetchTodos(options),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTodoStats() {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchTodoStats,
    staleTime: 60 * 1000,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTodoRequest) => createTodo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      toast.success('Todo created!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create todo';
      toast.error(message);
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoRequest }) =>
      updateTodo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      toast.success('Todo updated!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update todo';
      toast.error(message);
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      toast.success('Todo deleted!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete todo';
      toast.error(message);
    },
  });
}
