import { NavLink, useLocation } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/app/auth/AuthContext';
import { useChatStore } from '@/app/chat/ChatProvider';

function navClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition touch-manipulation ${
    isActive ? 'bg-sage-100 text-sage-800' : 'text-warm-600 active:bg-cream-100'
  }`;
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconBoard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M21 12a8 8 0 0 1-8 8H8l-4 3v-6.2A8 8 0 1 1 21 12Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
    </svg>
  );
}

/** Нижняя панель навигации (только узкий экран): быстрый доступ к основным разделам. */
export function MobileBottomNav() {
  const { isAuthenticated } = useAuth();
  const { getTotalUnread } = useChatStore();
  const location = useLocation();
  const unread = getTotalUnread();

  const hide =
    location.pathname === ROUTES.auth ||
    /^\/chats\/[^/]+/.test(location.pathname);

  if (hide) return null;

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[150] border-t border-cream-200/90 bg-cream-50/95 px-2 pt-1 backdrop-blur-md sm:hidden"
      aria-label="Мобильная навигация"
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-0.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        <NavLink to={ROUTES.home} end className={navClass}>
          <IconHome className="h-5 w-5 shrink-0" />
          <span>Главная</span>
        </NavLink>
        <NavLink to={ROUTES.board} className={navClass}>
          <IconBoard className="h-5 w-5 shrink-0" />
          <span>Доска</span>
        </NavLink>
        {isAuthenticated ? (
          <NavLink to={ROUTES.chats} className={({ isActive }) => `relative ${navClass({ isActive })}`}>
            <span className="relative">
              <IconChat className="h-5 w-5 shrink-0" />
              {unread > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              ) : null}
            </span>
            <span>Чаты</span>
          </NavLink>
        ) : null}
        <NavLink to={isAuthenticated ? ROUTES.myProfile : ROUTES.auth} className={navClass}>
          <IconUser className="h-5 w-5 shrink-0" />
          <span>{isAuthenticated ? 'Профиль' : 'Войти'}</span>
        </NavLink>
      </div>
    </nav>
  );
}
