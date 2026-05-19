/** Совпадает с DECIMAL(10,2) в PostgreSQL — колонка listings.price_per_day */
export const MAX_LISTING_PRICE_PER_DAY = 99_999_999.99;

/** Проверка цены за сутки перед отправкой на API. */
export function validateListingPricePerDay(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(',', '.');
  const price = Number.parseFloat(normalized);
  if (!Number.isFinite(price)) {
    return 'Укажите корректную цену';
  }
  if (price < 0) {
    return 'Цена не может быть отрицательной';
  }
  if (price > MAX_LISTING_PRICE_PER_DAY) {
    return `Максимум ${MAX_LISTING_PRICE_PER_DAY.toLocaleString('ru-RU')} ₽ за сутки`;
  }
  return null;
}

/** Нормализует цену для API (округление до копеек). */
export function parseListingPricePerDay(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const price = Number.parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(price) || price < 0) return undefined;
  return Math.min(Math.round(price * 100) / 100, MAX_LISTING_PRICE_PER_DAY);
}
