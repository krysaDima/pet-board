import type { Listing } from '@/entities/listing/model/types';

/**
 * Краткая строка цены для списка объявлений (₽/сутки или прочерк).
 */
export function formatListingPriceShort(listing: Listing): string {
  const p = listing.priceRubPerDay;
  if (p != null && Number.isFinite(p) && p >= 0) {
    return `${p.toLocaleString('ru-RU')} ₽/сут`;
  }
  return '—';
}
