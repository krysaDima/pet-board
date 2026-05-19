import type { ListingQuota } from '@/entities/listing/model/quota';

/** Запасной лимит, если API квоты недоступен (совпадает с app.listings.quota.free-max-listings). */
export const DEFAULT_FREE_LISTING_MAX = 1;

export function canCreateMoreListingsFromQuota(quota: ListingQuota | undefined, fallbackCount: number): boolean {
  if (quota) return quota.canCreateMore;
  return fallbackCount < DEFAULT_FREE_LISTING_MAX;
}

export function formatListingQuotaUsage(quota: ListingQuota): string {
  return `${quota.currentCount} из ${quota.maxListings}`;
}
