import axios, { type AxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

const TOKEN_KEY = 'access_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as ApiErrorBody | undefined;
  if (typeof data?.detail === 'string') {
    return data.detail;
  }
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
    return data.detail[0].msg!;
  }
  if (typeof data?.message === 'string') {
    return data.message;
  }
  if (error.message) {
    return error.message;
  }
  return fallback;
}
