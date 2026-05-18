/**
 * Пути приложения — единая точка правды для React Router и компонентов Link/NavLink.
 * Относительные сегменты (без ведущего «/») используются только внутри <Route path="...">.
 */
export const ROUTES = {
  home: '/',
  board: '/perederzhka',
  helpAnimals: '/pomosh-zhivotnym',
  petServices: '/uslugi-dlya-zhivotnykh',
  auth: '/auth',
  chats: '/chats',
  listing: (listingId: string) => `/listing/${listingId}`,
  /** Личный кабинет: в API использовать только `/me/*`, не подставлять сегмент URL в `{userId}`. */
  myProfile: '/profile',
  profile: (userId: string) => `/profile/${userId}`,
  chatThread: (chatId: string) => `/chats/${chatId}`,
} as const;

/** Сегменты для вложенных маршрутов (родитель — «/» с layout). */
export const ROUTE_SEGMENTS = {
  board: 'perederzhka',
  helpAnimals: 'pomosh-zhivotnym',
  petServices: 'uslugi-dlya-zhivotnykh',
  auth: 'auth',
  listing: 'listing',
  profile: 'profile',
  chats: 'chats',
} as const;
