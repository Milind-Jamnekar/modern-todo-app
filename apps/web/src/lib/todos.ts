import api from './api';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodosResponse,
  TodoStatus,
} from '@repo/types';

interface FetchTodosParams {
  page?: number;
  limit?: number;
  status?: TodoStatus;
  search?: string;
}

export async function fetchTodos(params: FetchTodosParams = {}): Promise<TodosResponse> {
  const { data } = await api.get<{ data: TodosResponse }>('/todos', { params });
  return data.data;
}

export async function fetchTodo(id: string): Promise<Todo> {
  const { data } = await api.get<{ data: Todo }>(`/todos/${id}`);
  return data.data;
}

export async function createTodo(payload: CreateTodoRequest): Promise<Todo> {
  const { data } = await api.post<{ data: Todo }>('/todos', payload);
  return data.data;
}

export async function updateTodo(id: string, payload: UpdateTodoRequest): Promise<Todo> {
  const { data } = await api.patch<{ data: Todo }>(`/todos/${id}`, payload);
  return data.data;
}

export async function deleteTodo(id: string): Promise<void> {
  await api.delete(`/todos/${id}`);
}

export async function fetchTodoStats(): Promise<Record<string, number>> {
  const { data } = await api.get<{ data: Record<string, number> }>('/todos/stats');
  return data.data;
}
