import { Route, Routes } from 'react-router';
import { AppLayout } from '@/widgets/layout/AppLayout';
import { ROUTES, ROUTE_SEGMENTS } from '@/shared/config/routes';
import { RequireAuth } from '@/app/auth/RequireAuth';
import { MainHubPage } from '@/pages/MainHubPage';
import { BoardListPage } from '@/pages/BoardListPage';
import { HelpAnimalsPlaceholderPage } from '@/pages/HelpAnimalsPlaceholderPage';
import { PetServicesPlaceholderPage } from '@/pages/PetServicesPlaceholderPage';
import { AuthPage } from '@/pages/AuthPage';
import { ListingPage } from '@/pages/ListingPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ChatsPage } from '@/pages/ChatsPage';
import { ChatPage } from '@/pages/ChatPage';

/**
 * Декларация маршрутов вынесена из AppRoot (разделение ответственности: корень приложения vs карта URL).
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<MainHubPage />} />
        <Route path={ROUTE_SEGMENTS.board} element={<BoardListPage />} />
        <Route path={ROUTE_SEGMENTS.helpAnimals} element={<HelpAnimalsPlaceholderPage />} />
        <Route path={ROUTE_SEGMENTS.petServices} element={<PetServicesPlaceholderPage />} />
        <Route path={ROUTE_SEGMENTS.auth} element={<AuthPage />} />
        <Route path={`${ROUTE_SEGMENTS.listing}/:listingId`} element={<ListingPage />} />
        <Route
          path={ROUTE_SEGMENTS.profile}
          element={
            <RequireAuth redirectTo={ROUTES.auth} rememberRedirect>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path={`${ROUTE_SEGMENTS.profile}/:userId`} element={<ProfilePage />} />
        <Route
          path={ROUTE_SEGMENTS.chats}
          element={
            <RequireAuth>
              <ChatsPage />
            </RequireAuth>
          }
        />
        <Route
          path={`${ROUTE_SEGMENTS.chats}/:chatId`}
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
