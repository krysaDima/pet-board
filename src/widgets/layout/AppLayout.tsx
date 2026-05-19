import { useLayoutEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { Link, NavLink, Outlet } from 'react-router';
import { fetchMyProfile, isApiMocksMode } from '@/api/listingsApi';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuth } from '@/app/auth/AuthContext';
import { Avatar } from '@/shared/ui/Avatar';

function navClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-200 sm:min-h-0 sm:flex-none sm:px-3.5 sm:text-sm ${
    isActive
      ? 'bg-amber-100/90 text-amber-950 shadow-sm ring-1 ring-amber-200/60'
      : 'text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-sm active:bg-stone-200/80'
  }`;
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
        fill="currentColor"
        opacity="0.92"
      />
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
    </svg>
  );
}

/** Общая оболочка: шапка и контент. Лёгкий вход через GSAP. */
export function AppLayout() {
  const shellRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, logout, userId } = useAuth();
  const myProfileQuery = useQuery({
    queryKey: queryKeys.myProfile(userId ?? ''),
    queryFn: fetchMyProfile,
    enabled: isAuthenticated && Boolean(userId),
  });
  const me = myProfileQuery.data;

  useLayoutEffect(() => {
    const root = shellRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.app-shell-header', {
        y: -18,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.out',
      });
      gsap.from('.app-shell-main', {
        opacity: 0,
        y: 14,
        duration: 0.45,
        ease: 'power2.out',
        delay: 0.06,
      });
      gsap.from('.app-shell-footer', {
        opacity: 0,
        duration: 0.4,
        delay: 0.2,
        ease: 'power2.out',
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={shellRef} className="flex min-h-screen flex-col font-sans">
      <header className="app-shell-header border-b border-amber-900/10 bg-white/75 pt-[env(safe-area-inset-top,0px)] shadow-sm shadow-amber-900/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5">
          <Link
            to={ROUTES.home}
            className="group relative shrink-0 touch-manipulation self-center sm:self-auto"
            aria-label="На главную — Счастливый питомец"
          >
            <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
              <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight sm:text-[1.65rem]">
                <span className="bg-gradient-to-r from-amber-700 via-amber-500 to-rose-600 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                  Счастливый
                </span>{' '}
                <span className="text-stone-800 transition-colors duration-200 group-hover:text-stone-950">питомец</span>
              </span>
              <span
                className="inline-block translate-y-px text-lg text-amber-600/90 transition-transform duration-200 group-hover:rotate-[-8deg] sm:text-xl"
                aria-hidden
              >
                🐾
              </span>
            </span>
            <span className="mt-1 block h-0.5 max-w-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-300 group-hover:max-w-full" />
          </Link>

          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <nav
              className="flex min-w-0 flex-1 gap-1 rounded-2xl bg-stone-100/60 p-1 ring-1 ring-stone-200/60 sm:flex-none sm:shrink-0"
              aria-label="Основная навигация"
            >
              <NavLink to={ROUTES.home} end className={navClass}>
                Главная
              </NavLink>
              {isAuthenticated ? (
                <NavLink to={ROUTES.chats} className={navClass}>
                  Чаты
                </NavLink>
              ) : null}
            </nav>

            {isAuthenticated ? (
              <div className="flex shrink-0 items-center gap-2 pl-1 sm:pl-0">
                <Link
                  to={ROUTES.myProfile}
                  className="flex touch-manipulation items-center gap-2 rounded-xl py-1 pr-1 pl-1 ring-1 ring-transparent transition hover:bg-amber-50/80 hover:ring-amber-200/60"
                  title="Мой профиль"
                >
                  {me ? (
                    <Avatar src={me.avatarUrl} alt={me.displayName} size="sm" mediaAuthFallback={!isApiMocksMode()} />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-200 text-xs font-bold text-stone-600">
                      Я
                    </span>
                  )}
                  <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-stone-700 sm:inline">
                    {me?.displayName ?? 'Профиль'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="touch-manipulation rounded-lg px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.auth}
                className="flex min-h-[44px] shrink-0 touch-manipulation items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-amber-900/15 ring-1 ring-amber-400/40 transition hover:from-amber-500 hover:to-amber-400 active:scale-[0.98]"
              >
                <UserCircleIcon className="opacity-95" />
                <span>Авторизоваться</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="app-shell-main mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-4 sm:py-10">
        <Outlet />
      </main>
      <footer className="app-shell-footer border-t border-stone-200/80 bg-white/60 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-xs leading-snug text-stone-500 backdrop-blur-sm sm:text-sm">
        Счастливый питомец — пробная версия без бэкенда · данные и чаты хранятся в памяти страницы
      </footer>
    </div>
  );
}
