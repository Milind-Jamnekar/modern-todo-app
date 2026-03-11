import Cookies from 'js-cookie';
import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@repo/types';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: 1 / 96, // 15 minutes
    sameSite: 'strict',
  });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 7,
    sameSite: 'strict',
  });
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(ACCESS_TOKEN_KEY);
}

export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<{ data: AuthResponse }>('/auth/login', credentials);
  const response = data.data;
  setTokens(response.tokens.accessToken, response.tokens.refreshToken);
  return response;
}

export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<{ data: AuthResponse }>('/auth/register', payload);
  const response = data.data;
  setTokens(response.tokens.accessToken, response.tokens.refreshToken);
  return response;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<{ data: User }>('/auth/me');
  return data.data;
}
