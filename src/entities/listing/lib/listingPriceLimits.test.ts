import { describe, expect, it } from 'vitest';
import {
  MAX_LISTING_PRICE_PER_DAY,
  parseListingPricePerDay,
  validateListingPricePerDay,
} from './listingPriceLimits';

describe('listingPriceLimits', () => {
  it('принимает пустую цену', () => {
    expect(validateListingPricePerDay('')).toBeNull();
    expect(parseListingPricePerDay('')).toBeUndefined();
  });

  it('отклоняет цену выше лимита БД', () => {
    expect(validateListingPricePerDay(String(MAX_LISTING_PRICE_PER_DAY + 1))).toMatch(/Максимум/);
  });

  it('нормализует допустимую цену', () => {
    expect(parseListingPricePerDay('1500')).toBe(1500);
    expect(parseListingPricePerDay('1 500,50'.replace(' ', ''))).toBe(1500.5);
  });
});
