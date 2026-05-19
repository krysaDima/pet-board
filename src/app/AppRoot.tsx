import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { AuthProvider } from '@/app/auth/AuthContext';
import { AppNoticeProvider } from '@/app/notice/AppNoticeProvider';
import { BlockedUsersProvider } from '@/app/block/BlockedUsersProvider';
import { ChatProvider } from '@/app/chat/ChatProvider';
import { AppRouter } from '@/app/router/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

/** Убираем завершающий слэш: у Vite BASE_URL вида `/repo/`, у RR basename — без финального `/`. */
function routerBasename(): string | undefined {
  const b = import.meta.env.BASE_URL.replace(/\/$/, '');
  return b === '' ? undefined : b;
}

/** Корень: провайдеры и роутер без смешения с картой маршрутов. */
export function AppRoot() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={routerBasename()}>
          <AuthProvider>
            <AppNoticeProvider>
              <BlockedUsersProvider>
                <ChatProvider>
                  <AppRouter />
                </ChatProvider>
              </BlockedUsersProvider>
            </AppNoticeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
