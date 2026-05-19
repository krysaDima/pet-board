/** Тариф пользователя (с бэкенда). */
export type UserPlanApi = 'FREE' | 'SUBSCRIBED';

/** Квота объявлений `GET /me/listings/quota`. */
export type ListingQuota = {
  plan: UserPlanApi;
  maxListings: number;
  currentCount: number;
  canCreateMore: boolean;
  subscription: {
    upgradeEnabled: boolean;
    active: boolean;
    maxListingsWhenSubscribed: number;
    hint: string | null;
  };
};
