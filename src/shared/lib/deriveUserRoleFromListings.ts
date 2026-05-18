import type { UserRole } from '@/api/types';
import type { ListingKind } from '@/entities/listing/model/types';

/**
 * Роль в сервисе по типам объявлений пользователя:
 * только «возьму» → SITTER, только «ищу» → SEEKER, оба типа → BOTH.
 * Без объявлений — не менять роль на клиенте (undefined).
 */
export function deriveUserRoleFromListings(listings: { kind: ListingKind }[]): UserRole | undefined {
  let hasOffer = false;
  let hasNeed = false;
  for (const { kind } of listings) {
    if (kind === 'offer_sitter') hasOffer = true;
    if (kind === 'need_sitter') hasNeed = true;
    if (hasOffer && hasNeed) return 'BOTH';
  }
  if (hasOffer && hasNeed) return 'BOTH';
  if (hasOffer) return 'SITTER';
  if (hasNeed) return 'SEEKER';
  return undefined;
}
