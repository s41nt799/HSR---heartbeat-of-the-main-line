import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
} from '../api/client';
import type { AuthRegisterRequest, UserMe } from '../types/api';

// ─── Types ─────────────────────────────────────────
interface AuthContextValue {
  user: UserMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: AuthRegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserMe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getStoredToken());

  // ─── Logout ──────────────────────────────────────
  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // ─── Регистрируем обработчик 401 из client.ts ────
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken();
      setUser(null);
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  // ─── Восстановление сессии при загрузке ──────────
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    authApi
      .me()
      .then((data) => {
        if (!cancelled) setUser(data as UserMe);
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Login ───────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      setStoredToken(data.access_token);
      setUser(data.user);
    },
    [],
  );

  // ─── Register ────────────────────────────────────
  const register = useCallback(
    async (body: AuthRegisterRequest) => {
      // доп. проверка на всякий случай (основная — в форме)
      if (body.password.length < 8) {
        throw new Error('Пароль должен быть минимум 8 символов');
      }
      const data = await authApi.register(body);
      setStoredToken(data.access_token);
      setUser(data.user);
    },
    [],
  );

  // ─── Value ───────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}