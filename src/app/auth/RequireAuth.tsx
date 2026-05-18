import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/app/auth/AuthContext';

type RequireAuthProps = {
  children: ReactNode;
  /** Куда увести гостя (по умолчанию — главная). */
  redirectTo?: string;
  /** Передать `from`: текущий путь вернуть после входа (`location.state`). */
  rememberRedirect?: boolean;
};

/** Если нет сессии — редирект; иначе дочерний элемент. */
export function RequireAuth({ children, redirectTo = ROUTES.home, rememberRedirect = false }: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={rememberRedirect ? { from: location.pathname + location.search } : undefined}
      />
    );
  }

  return children;
}
