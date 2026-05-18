import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse, RegisterRequest, LoginRequest, StoredSession } from '@/api/types';
import {
  apiPost,
  getStoredSession,
  saveSession,
  clearSession,
  authResponseToSession,
  isRefreshTokenExpired,
  ApiError,
} from '@/api/client';
import { MOCK_CURRENT_USER_ID } from '@/api/mocks/data';

type AuthContextValue = {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterRequest, rememberMe?: boolean) => Promise<void>;
  login: (data: LoginRequest, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  demoLogin: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialSession(): StoredSession | null {
  const session = getStoredSession();
  if (!session) return null;
  if (isRefreshTokenExpired(session)) {
    clearSession();
    return null;
  }
  return session;
}

/**
 * Провайдер авторизации.
 * Поддерживает реальную JWT-авторизацию и демо-режим (для разработки без бэкенда).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(getInitialSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = session !== null;
  const userId = session?.userId ?? null;

  const handleAuthResponse = useCallback((res: AuthResponse, rememberMe = true) => {
    const newSession = authResponseToSession(res);
    saveSession(newSession, rememberMe);
    setSession(newSession);
    setError(null);
  }, []);

  const register = useCallback(
    async (data: RegisterRequest, rememberMe = true) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiPost<AuthResponse>('/auth/register', data, false);
        handleAuthResponse(res, rememberMe);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.problem.detail || e.problem.title);
        } else {
          setError('Ошибка подключения к серверу');
        }
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthResponse],
  );

  const login = useCallback(
    async (data: LoginRequest, rememberMe = true) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiPost<AuthResponse>('/auth/login', data, false);
        handleAuthResponse(res, rememberMe);
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.status === 401) {
            setError('Неверный email или пароль');
          } else {
            setError(e.problem.detail || e.problem.title);
          }
        } else {
          setError('Ошибка подключения к серверу');
        }
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthResponse],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const demoLogin = useCallback(() => {
    const demoSession: StoredSession = {
      userId: MOCK_CURRENT_USER_ID,
      accessToken: 'demo-token',
      refreshToken: 'demo-refresh',
      accessTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      refreshTokenExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    saveSession(demoSession, true);
    setSession(demoSession);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      userId,
      isLoading,
      error,
      register,
      login,
      logout,
      clearError,
      demoLogin,
    }),
    [isAuthenticated, userId, isLoading, error, register, login, logout, clearError, demoLogin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth должен вызываться внутри AuthProvider');
  }
  return ctx;
}
