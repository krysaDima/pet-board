import { Navigate } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/app/auth/AuthContext';
import type { ReactNode } from 'react';

/** Редирект на главную, если пользователь не «вошёл» (демо). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return children;
}
