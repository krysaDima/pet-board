import { useLayoutEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { fetchMyProfile, isApiMocksMode } from '@/api/listingsApi';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuth } from '@/app/auth/AuthContext';
import { useChatStore } from '@/app/chat/ChatProvider';
import { Avatar } from '@/shared/ui/Avatar';
import { SiteLogo } from '@/shared/ui/SiteLogo';
import { MobileBottomNav } from '@/widgets/layout/MobileBottomNav';

function headerNavClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition sm:px-4 sm:text-sm ${
    isActive
      ? 'bg-sage-600 text-white shadow-sm'
      : 'text-warm-700 hover:bg-cream-100 hover:text-warm-900'
  }`;
}

/** Общая оболочка: шапка в стиле лендинга, контент, подвал с контактами. */
export function AppLayout() {
  const shellRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isHome = location.pathname === ROUTES.home;
  const { isAuthenticated, logout, userId } = useAuth();
  const { getTotalUnread } = useChatStore();
  const myProfileQuery = useQuery({
    queryKey: queryKeys.myProfile(userId ?? ''),
    queryFn: fetchMyProfile,
    enabled: isAuthenticated && Boolean(userId),
  });
  const me = myProfileQuery.data;
  const unreadCount = getTotalUnread();

  useLayoutEffect(() => {
    const root = shellRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.app-shell-header', { y: -18, opacity: 0, duration: 0.55, ease: 'power3.out' });
      gsap.from('.app-shell-main', { opacity: 0, y: 14, duration: 0.45, ease: 'power2.out', delay: 0.06 });
      gsap.from('.app-shell-footer', { opacity: 0, duration: 0.4, delay: 0.2, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={shellRef} className="flex min-h-screen flex-col font-sans">
      <header className="app-shell-header border-b border-cream-200/80 bg-cream-50/90 pt-[env(safe-area-inset-top,0px)] shadow-sm shadow-sage-900/5 backdrop-blur-md">
        <HeaderInner isAuthenticated={isAuthenticated} me={me} logout={logout} unreadCount={unreadCount} />
      </header>
      <main
        className={`app-shell-main mx-auto w-full flex-1 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-sm:pb-[calc(5.25rem+env(safe-area-inset-bottom))] ${
          isHome ? 'max-w-6xl py-6 pt-5 sm:py-8' : 'max-w-5xl py-6 pt-4 sm:py-10'
        }`}
      >
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function HeaderInner({
  isAuthenticated,
  me,
  logout,
  unreadCount,
}: {
  isAuthenticated: boolean;
  me: Awaited<ReturnType<typeof fetchMyProfile>> | undefined;
  logout: () => void;
  unreadCount: number;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-2.5 sm:py-4">
      <div className="flex items-center justify-between gap-3 sm:justify-center">
        <SiteLogo className="shrink-0" />
        <div className="flex items-center gap-2 sm:hidden">
          {isAuthenticated ? <HeaderAuth me={me} logout={logout} compact /> : null}
        </div>
      </div>

      <nav
        className="mt-3 hidden flex-wrap items-center justify-center gap-1 sm:flex sm:justify-center"
        aria-label="Основная навигация"
      >
        <NavLink to={ROUTES.home} end className={headerNavClass}>
          Главная
        </NavLink>
        <NavLink to={ROUTES.board} className={headerNavClass}>
          Передержка
        </NavLink>
        <NavLink to={ROUTES.helpAnimals} className={headerNavClass}>
          Помощь
        </NavLink>
        <NavLink to={ROUTES.petServices} className={headerNavClass}>
          Услуги
        </NavLink>
        {isAuthenticated ? (
          <NavLink to={ROUTES.chats} className={({ isActive }) => `relative ${headerNavClass({ isActive })}`}>
            Чаты
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ) : null}
      </nav>

      <div className="mt-3 hidden items-center justify-center gap-2 sm:flex sm:justify-end">
        {isAuthenticated ? (
          <HeaderAuth me={me} logout={logout} />
        ) : (
          <>
            <Link
              to={ROUTES.auth}
              className="inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold text-warm-700 ring-1 ring-cream-300 hover:bg-cream-100"
            >
              Войти
            </Link>
            <Link
              to={ROUTES.board}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-full bg-sage-600 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-sage-900/20 transition hover:bg-sage-700 active:scale-[0.98]"
            >
              Забронировать
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function HeaderAuth({
  me,
  logout,
  compact = false,
}: {
  me: Awaited<ReturnType<typeof fetchMyProfile>> | undefined;
  logout: () => void;
  compact?: boolean;
}) {
  return (
    <>
      <Link
        to={ROUTES.myProfile}
        className={`flex touch-manipulation items-center rounded-full ring-1 ring-cream-300 transition hover:bg-cream-100 ${
          compact ? 'p-0.5' : 'gap-2 py-1 pl-1 pr-3'
        }`}
        title="Мой профиль"
      >
        {me ? (
          <Avatar src={me.avatarUrl} alt={me.displayName} size="sm" mediaAuthFallback={!isApiMocksMode()} />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-800">
            Я
          </span>
        )}
        {!compact ? (
          <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-warm-800 sm:inline">
            {me?.displayName ?? 'Профиль'}
          </span>
        ) : null}
      </Link>
      {!compact ? (
        <button
          type="button"
          onClick={logout}
          className="touch-manipulation rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-warm-600 transition hover:bg-cream-200"
        >
          Выйти
        </button>
      ) : null}
    </>
  );
}

/** Подвал с контактами в стиле референсного макета. */
function SiteFooter() {
  return (
    <footer className="app-shell-footer border-t border-cream-200 bg-cream-50/80 px-4 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm max-sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 text-sm text-warm-700">
          <p>
            <span className="font-semibold text-warm-900">Телефон:</span>{' '}
            <a href="tel:+74951234567" className="hover:text-sage-700">
              +7 (495) 123-45-67
            </a>
          </p>
          <p>
            <span className="font-semibold text-warm-900">Почта:</span>{' '}
            <a href="mailto:hello@schastlivy-pesik.ru" className="hover:text-sage-700">
              hello@schastlivy-pesik.ru
            </a>
          </p>
          <p className="text-warm-600">Москва · работаем по всему городу и области</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-sage-600 text-white transition hover:bg-sage-700"
            aria-label="Telegram"
          >
            <span className="text-xs font-bold">TG</span>
          </a>
          <a
            href="https://vk.com"
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-sage-600 text-white transition hover:bg-sage-700"
            aria-label="ВКонтакте"
          >
            <span className="text-xs font-bold">VK</span>
          </a>
        </div>

        <p className="text-xs text-warm-600 sm:text-right">
          © {new Date().getFullYear()} Счастливый пёсик
          <br />
          <span className="text-warm-500">Пробная версия · данные в памяти сессии</span>
        </p>
      </div>
    </footer>
  );
}
