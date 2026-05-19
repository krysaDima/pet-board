import { describe, expect, it } from 'vitest';
import { canCreateMoreListingsFromQuota, formatListingQuotaUsage } from './listingLimits';
import type { ListingQuota } from '@/entities/listing/model/quota';

const freeQuota: ListingQuota = {
  plan: 'FREE',
  maxListings: 1,
  currentCount: 1,
  canCreateMore: false,
  subscription: {
    upgradeEnabled: false,
    active: false,
    maxListingsWhenSubscribed: 10,
    hint: 'Скоро: подписка',
  },
};

describe('listingLimits', () => {
  it('использует квоту с API', () => {
    expect(canCreateMoreListingsFromQuota(freeQuota, 0)).toBe(false);
    expect(formatListingQuotaUsage({ ...freeQuota, currentCount: 0, canCreateMore: true })).toBe('0 из 1');
  });

  it('fallback без квоты', () => {
    expect(canCreateMoreListingsFromQuota(undefined, 0)).toBe(true);
    expect(canCreateMoreListingsFromQuota(undefined, 1)).toBe(false);
  });
});
