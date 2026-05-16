import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/auth/AuthContext';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import type { UserRole } from '@/api/types';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
  displayName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  role: z.enum(['SITTER', 'SEEKER', 'BOTH'] as const),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Страница авторизации: вход, регистрация и демо-режим.
 */
export function AuthPage() {
  const { login, register, demoLogin, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home;

  const [mode, setMode] = useState<'login' | 'register'>('login');

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '', role: 'BOTH' },
  });

  const navigateAfterAuth = () => {
    navigate(from === '/auth' ? ROUTES.home : from, { replace: true });
  };

  const onLogin = async (data: LoginFormData) => {
    try {
      await login(data);
      navigateAfterAuth();
    } catch {
      /* ошибка показана в error */
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      await register(data);
      navigateAfterAuth();
    } catch {
      /* ошибка показана в error */
    }
  };

  const onDemoLogin = () => {
    demoLogin();
    navigateAfterAuth();
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    clearError();
  };

  if (isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <p className="text-stone-700">Вы уже вошли.</p>
        <Link to={ROUTES.home} className="text-amber-800 underline">
          На главную
        </Link>
      </div>
    );
  }

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'SITTER', label: 'Предлагаю передержку' },
    { value: 'SEEKER', label: 'Ищу передержку' },
    { value: 'BOTH', label: 'Оба варианта' },
  ];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        to={ROUTES.home}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
      >
        ← На главную
      </Link>

      <Card className="space-y-5 p-6 sm:p-8">
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Регистрация
          </button>
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...loginForm.register('email')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="example@mail.ru"
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-stone-700">
                Пароль
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...loginForm.register('password')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button variant="primary" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="mb-1 block text-sm font-medium text-stone-700">
                Имя
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                {...registerForm.register('displayName')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Как вас называть"
              />
              {registerForm.formState.errors.displayName && (
                <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.displayName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                {...registerForm.register('email')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="example@mail.ru"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-stone-700">
                Пароль
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                {...registerForm.register('password')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Минимум 8 символов"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-role" className="mb-1 block text-sm font-medium text-stone-700">
                Роль
              </label>
              <select
                id="reg-role"
                {...registerForm.register('role')}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="primary" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-500">или</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" type="button" onClick={onDemoLogin}>
          Войти без регистрации (демо)
        </Button>

        <p className="text-center text-xs text-stone-500">Демо-режим для тестирования без бэкенда</p>
      </Card>
    </div>
  );
}
