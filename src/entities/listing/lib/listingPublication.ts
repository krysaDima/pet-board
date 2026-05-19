/** Срок по умолчанию при публикации (синхронно с app.listings.default-publication-days на бэкенде). */
export const DEFAULT_LISTING_PUBLICATION_DAYS = 30;

export const MAX_LISTING_PUBLICATION_DAYS = 365;

/** `YYYY-MM-DD` из `<input type="date">` → ISO для API (конец выбранного дня, локальное время). */
export function dateInputToExpiresAt(dateStr: string): string | undefined {
  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;
  const parts = trimmed.split('-').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [year, month, day] = parts;
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (Number.isNaN(end.getTime())) return undefined;
  return end.toISOString();
}

/** ISO с API → значение для `<input type="date">`. */
export function expiresAtToDateInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Минимальная дата для поля (сегодня). */
export function minPublicationDateInput(): string {
  return expiresAtToDateInput(new Date().toISOString());
}

/** Максимальная дата (через MAX_LISTING_PUBLICATION_DAYS). */
export function maxPublicationDateInput(): string {
  const d = new Date();
  d.setDate(d.getDate() + MAX_LISTING_PUBLICATION_DAYS);
  return expiresAtToDateInput(d.toISOString());
}

type ListingExpirySource = {
  expiresAt?: string;
  publishedAt?: string;
  createdAt?: string;
  publishStatus?: ListingStatusForHint;
};

/** Дата снятия: из API или расчёт для старых объявлений без expires_at. */
export function resolveEffectiveExpiresAt(listing: ListingExpirySource): string | undefined {
  if (listing.expiresAt) return listing.expiresAt;
  if (listing.publishStatus !== 'PUBLISHED') return undefined;
  const baseIso = listing.publishedAt ?? listing.createdAt;
  if (!baseIso) return undefined;
  const base = new Date(baseIso);
  if (Number.isNaN(base.getTime())) return undefined;
  base.setDate(base.getDate() + DEFAULT_LISTING_PUBLICATION_DAYS);
  return base.toISOString();
}

/** Короткая подпись для карточки: «Осталось: 5 дней». */
export function formatPublishedDaysLeftRu(listing: ListingExpirySource): string | null {
  if (listing.publishStatus !== 'PUBLISHED') return null;
  const expires = resolveEffectiveExpiresAt(listing);
  const remaining = formatRemainingUntilRu(expires);
  if (!remaining) return null;
  if (remaining === 'скоро') return 'Снимется с доски скоро';
  const tail = remaining.replace(/^через\s+/i, '');
  return `Осталось: ${tail}`;
}

export function getListingExpirationHintForListing(listing: ListingExpirySource): ListingExpirationHint | null {
  return getListingExpirationHint(listing.publishStatus, resolveEffectiveExpiresAt(listing));
}

export function formatExpiresAtRu(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** «через 5 дней», «через 2 часа» — до даты expiresAt. */
export function formatRemainingUntilRu(iso: string | undefined): string | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;

  const diffMs = end - Date.now();
  if (diffMs <= 0) return 'скоро';

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (days >= 1) {
    return `через ${days} ${pluralRu(days, 'день', 'дня', 'дней')}`;
  }
  if (hours >= 1) {
    return `через ${hours} ${pluralRu(hours, 'час', 'часа', 'часов')}`;
  }
  const mins = Math.max(1, minutes);
  return `через ${mins} ${pluralRu(mins, 'минуту', 'минуты', 'минут')}`;
}

export type ListingExpirationHint = {
  primary: string;
  secondary?: string;
  urgent?: boolean;
};

type ListingStatusForHint =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'EXPIRED'
  | undefined;

/** Текст для блока «Мои объявления» — сколько осталось до снятия с доски. */
export function getListingExpirationHint(
  status: ListingStatusForHint,
  expiresAt: string | undefined,
): ListingExpirationHint | null {
  const dateLabel = formatExpiresAtRu(expiresAt);
  const remaining = formatRemainingUntilRu(expiresAt);

  if (status === 'PUBLISHED') {
    if (remaining) {
      return {
        primary: `Исчезнет с доски ${remaining}`,
        secondary: dateLabel ? `(${dateLabel})` : undefined,
        urgent: remaining === 'скоро' || remaining.includes('минут') || remaining.includes('час'),
      };
    }
    if (dateLabel) {
      return { primary: `На доске до ${dateLabel}` };
    }
    return null;
  }

  if (status === 'DRAFT' || status === 'PENDING_REVIEW') {
    if (expiresAt && dateLabel) {
      return {
        primary: `После публикации исчезнет с доски ${dateLabel}`,
        secondary: remaining ? `(сейчас это ${remaining})` : undefined,
      };
    }
    return {
      primary: `После публикации исчезнет с доски через ${DEFAULT_LISTING_PUBLICATION_DAYS} ${pluralRu(DEFAULT_LISTING_PUBLICATION_DAYS, 'день', 'дня', 'дней')}`,
    };
  }

  if (status === 'EXPIRED') {
    return {
      primary: dateLabel ? `Снято с доски ${dateLabel}` : 'Снято с доски автоматически',
    };
  }

  if (status === 'ARCHIVED') {
    return { primary: 'Снято с доски вручную' };
  }

  return null;
}
