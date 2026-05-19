import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { generateUniqueId } from '@/shared/lib/generateId';

export type NoticeVariant = 'error' | 'success' | 'info';

type Notice = {
  id: string;
  variant: NoticeVariant;
  title: string;
  message?: string;
};

type ShowNoticeInput = {
  variant?: NoticeVariant;
  title: string;
  message?: string;
  durationMs?: number;
};

type AppNoticeContextValue = {
  showNotice: (input: ShowNoticeInput) => void;
  error: (title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
};

const AppNoticeContext = createContext<AppNoticeContextValue | null>(null);

const VARIANT_META: Record<
  NoticeVariant,
  { icon: string; ring: string; bg: string; title: string; accent: string }
> = {
  error: {
    icon: '⚠️',
    ring: 'ring-red-200/80',
    bg: 'bg-gradient-to-br from-red-50 to-white',
    title: 'text-red-900',
    accent: 'border-red-200/90',
  },
  success: {
    icon: '✓',
    ring: 'ring-emerald-200/80',
    bg: 'bg-gradient-to-br from-emerald-50 to-white',
    title: 'text-emerald-900',
    accent: 'border-emerald-200/90',
  },
  info: {
    icon: 'ℹ️',
    ring: 'ring-amber-200/80',
    bg: 'bg-gradient-to-br from-amber-50 to-white',
    title: 'text-amber-950',
    accent: 'border-amber-200/90',
  },
};

function NoticeCard({ notice, onDismiss }: { notice: Notice; onDismiss: (id: string) => void }) {
  const meta = VARIANT_META[notice.variant];

  return (
    <div
      className={`app-notice pointer-events-auto flex w-full gap-3 rounded-2xl border p-4 shadow-lg shadow-stone-900/10 ring-1 backdrop-blur-sm ${meta.bg} ${meta.accent} ${meta.ring}`}
      role="alert"
      aria-live="polite"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm"
        aria-hidden
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`text-sm font-semibold leading-snug ${meta.title}`}>{notice.title}</p>
        {notice.message ? (
          <p className="mt-1 text-sm leading-relaxed text-stone-600">{notice.message}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(notice.id)}
        className="shrink-0 rounded-lg p-1.5 text-stone-400 transition hover:bg-white/70 hover:text-stone-700"
        aria-label="Закрыть"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Глобальные toast-уведомления вместо window.alert. */
export function AppNoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotice = useCallback(
    ({ variant = 'info', title, message, durationMs = 4800 }: ShowNoticeInput) => {
      const id = generateUniqueId('notice');
      setNotices((prev) => [...prev, { id, variant, title, message }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo<AppNoticeContextValue>(
    () => ({
      showNotice,
      dismiss,
      error: (title, message) => showNotice({ variant: 'error', title, message }),
      success: (title, message) => showNotice({ variant: 'success', title, message }),
      info: (title, message) => showNotice({ variant: 'info', title, message }),
    }),
    [showNotice, dismiss],
  );

  const portal =
    notices.length > 0
      ? createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[300] flex flex-col items-center gap-2 px-4 max-sm:top-auto sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[4.5rem] sm:items-end sm:px-0">
            <div className="flex w-full max-w-sm flex-col gap-2">
              {notices.map((n) => (
                <NoticeCard key={n.id} notice={n} onDismiss={dismiss} />
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <AppNoticeContext.Provider value={value}>
      {children}
      {portal}
    </AppNoticeContext.Provider>
  );
}

export function useAppNotice() {
  const ctx = useContext(AppNoticeContext);
  if (!ctx) {
    throw new Error('useAppNotice must be used within AppNoticeProvider');
  }
  return ctx;
}
