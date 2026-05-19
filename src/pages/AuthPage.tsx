import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/auth/AuthContext';
import { ROUTES } from '@/shared/config/routes';
import { clearLegacySavedPasswordStorage, offerToSavePassword } from '@/shared/lib/browserCredentials';
import { getPasswordStrength } from '@/shared/lib/passwordStrength';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    password: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
    passwordConfirm: z.string().min(1, 'Повторите пароль'),
    displayName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Пароли не совпадают',
    path: ['passwordConfirm'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Страница авторизации: вход и регистрация.
 * Пароль не кладём в localStorage — только автозаполнение (`autocomplete`, `name`) и при возможности Credential Management API.
 * «Запомнить меня» влияет только на сессию (localStorage vs sessionStorage).
 */
export function AuthPage() {
  const { login, register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [rememberLogin, setRememberLogin] = useState(true);
  const [rememberRegister, setRememberRegister] = useState(true);
  const [regPasswordFocused, setRegPasswordFocused] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '', displayName: '' },
  });

  const regPassword = registerForm.watch('password');
  const strength = getPasswordStrength(regPassword);
  const showStrengthPanel =
    mode === 'register' && (regPasswordFocused || regPassword.length > 0) && strength.level > 0;
  const regPasswordField = registerForm.register('password');

  useEffect(() => {
    clearLegacySavedPasswordStorage();
  }, []);

  const navigateAfterAuth = () => {
    navigate(from === '/auth' ? ROUTES.home : from, { replace: true });
  };

  const onLogin = async (data: LoginFormData) => {
    try {
      await login(data, rememberLogin);
      void offerToSavePassword({ email: data.email, password: data.password });
      navigateAfterAuth();
    } catch {
      /* ошибка показана в error */
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      const { passwordConfirm: _, ...rest } = data;
      void _;
      await register({ ...rest, role: 'SEEKER' }, rememberRegister);
      void offerToSavePassword({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      navigateAfterAuth();
    } catch {
      /* ошибка показана в error */
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    clearError();
    setRegPasswordFocused(false);
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
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" autoComplete="on" method="post">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="username"
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

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                checked={rememberLogin}
                onChange={(e) => setRememberLogin(e.target.checked)}
              />
              <span>
                <span className="font-medium">Запомнить меня</span>
                <span className="mt-0.5 block text-xs font-normal text-stone-500">
                  Сохранять вход в аккаунт после закрытия браузера (токены в хранилище сайта). Пароль при желании сохранит
                  встроенный менеджер паролей браузера — отдельно от этой галочки.
                </span>
              </span>
            </label>

            <Button variant="primary" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" autoComplete="on" method="post">
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
                inputMode="email"
                autoComplete="email"
                {...registerForm.register('email')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="example@mail.ru"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className={`relative z-10 ${showStrengthPanel ? 'mb-[8.5rem] sm:mb-[7.5rem]' : ''}`}>
              <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-stone-700">
                Пароль
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                {...regPasswordField}
                onFocus={() => setRegPasswordFocused(true)}
                onBlur={(e) => {
                  void regPasswordField.onBlur(e);
                  setRegPasswordFocused(false);
                }}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Минимум 8 символов"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.password.message}</p>
              )}

              {showStrengthPanel ? (
                <div
                  className={`absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-stone-200 p-3 shadow-lg ${strength.trackClass}`}
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm font-semibold text-stone-900">Надёжность пароля: {strength.label}</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${strength.barClass}`}
                      style={{ width: `${(strength.level / 4) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone-700">{strength.detail}</p>
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="reg-password-2" className="mb-1 block text-sm font-medium text-stone-700">
                Повторите пароль
              </label>
              <input
                id="reg-password-2"
                type="password"
                autoComplete="new-password"
                {...registerForm.register('passwordConfirm')}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Те же символы, что выше"
              />
              {registerForm.formState.errors.passwordConfirm && (
                <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.passwordConfirm.message}</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                checked={rememberRegister}
                onChange={(e) => setRememberRegister(e.target.checked)}
              />
              <span>
                <span className="font-medium">Запомнить меня</span>
                <span className="mt-0.5 block text-xs font-normal text-stone-500">
                  Долгоживущая сессия на этом устройстве. Пара «логин + пароль» при успешной регистрации может предложить
                  сохранить сам браузер (Chrome, Edge, Safari…).
                </span>
              </span>
            </label>

            <Button variant="primary" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
