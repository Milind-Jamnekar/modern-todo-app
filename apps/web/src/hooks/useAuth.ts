'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
} from '@/lib/auth';
import type { LoginRequest, RegisterRequest } from '@repo/types';

export const AUTH_QUERY_KEY = ['auth', 'me'];

export function useMe() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => loginUser(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push('/todos');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => registerUser(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      router.push('/todos');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
      toast.success('Logged out successfully');
    },
  });
}
