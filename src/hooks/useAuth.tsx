import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, scenariosApi } from '../api';
import {
  clearStoredToken,
  getErrorMessage,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
} from '../api/client';
import type { UserMe } from '../types/api';

interface AuthContextValue {
  token: string | null;
  user: UserMe | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
    staleTime: 30_000,
  });

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      // Редирект на /login при 401 (вне React Router tree interceptor)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.assign('/login');
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      setStoredToken(data.access_token);
      setToken(data.access_token);
      await queryClient.prefetchQuery({
        queryKey: ['scenarios'],
        queryFn: () => scenariosApi.list({ limit: 20, offset: 0 }),
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    [queryClient],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const data = await authApi.register({
        email,
        password,
        display_name: displayName,
      });
      setStoredToken(data.access_token);
      setToken(data.access_token);
      await queryClient.prefetchQuery({
        queryKey: ['scenarios'],
        queryFn: () => scenariosApi.list({ limit: 20, offset: 0 }),
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: meQuery.data ?? null,
      isLoading: Boolean(token) && meQuery.isLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, meQuery.data, meQuery.isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export { getErrorMessage };
