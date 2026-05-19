/**
 * Ключи TanStack Query — избегаем опечаток и дублирования строк в queryKey.
 */
export const queryKeys = {
  listings: ['listings'] as const,
  listing: (id: string) => ['listing', id] as const,
  chat: (chatId: string) => ['chat', chatId] as const,
  /** Профиль по `GET /me/profile` привязан к сессии (userId только для ключа инвалидации). */
  myProfile: (userKey: string) => ['profile', 'me', userKey] as const,
  myReviews: (userKey: string) => ['reviews', 'me', userKey] as const,
  myPets: (userKey: string) => ['pets', 'me', userKey] as const,
  profile: (userId: string) => ['profile', userId] as const,
  reviews: (userId: string) => ['reviews', userId] as const,
  pets: (userId: string) => ['pets', userId] as const,
  myListings: (userKey: string) => ['listings', 'me', userKey] as const,
  myListingQuota: (userKey: string) => ['listings', 'me', 'quota', userKey] as const,
} as const;
