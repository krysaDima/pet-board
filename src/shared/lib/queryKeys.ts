/**
 * Ключи TanStack Query — избегаем опечаток и дублирования строк в queryKey.
 */
export const queryKeys = {
  listings: ['listings'] as const,
  listing: (id: string) => ['listing', id] as const,
  profile: (userId: string) => ['profile', userId] as const,
  reviews: (userId: string) => ['reviews', userId] as const,
  pets: (userId: string) => ['pets', userId] as const,
} as const;
