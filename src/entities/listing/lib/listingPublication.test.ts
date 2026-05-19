import { describe, expect, it } from 'vitest';
import {
  formatPublishedDaysLeftRu,
  formatRemainingUntilRu,
  getListingExpirationHint,
  resolveEffectiveExpiresAt,
} from './listingPublication';

describe('formatRemainingUntilRu', () => {
  it('показывает дни в будущем', () => {
    const inFiveDays = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(formatRemainingUntilRu(inFiveDays)).toMatch(/через 5 дн/);
  });
});

describe('getListingExpirationHint', () => {
  it('для опубликованного объявления показывает обратный отсчёт', () => {
    const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const hint = getListingExpirationHint('PUBLISHED', inThreeDays);
    expect(hint?.primary).toMatch(/Исчезнет с доски через/);
  });

  it('для черновика без даты — 30 дней', () => {
    const hint = getListingExpirationHint('DRAFT', undefined);
    expect(hint?.primary).toContain('30');
  });

  it('считает остаток для опубликованного без expires_at', () => {
    const publishedAt = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const label = formatPublishedDaysLeftRu({
      publishStatus: 'PUBLISHED',
      publishedAt,
    });
    expect(label).toMatch(/Осталось:/);
    expect(resolveEffectiveExpiresAt({ publishStatus: 'PUBLISHED', publishedAt })).toBeTruthy();
  });
});
