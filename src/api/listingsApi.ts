import type { Listing } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { PublicProfile, Review } from '@/entities/user/model/types';
import type { ListingDetailDto, ListingShortDto, Page, PetCardDto, ReviewDto, UserProfileDto, ListingsQueryParams, UserRole } from '@/api/types';
import type { ProfileRole } from '@/entities/user/model/types';
import { apiGet, getApiBaseUrl, getStoredSession } from '@/api/client';
import { mapListingDetailDtoToListing, mapPetDto } from '@/api/meApi';
import { mockListings, mockProfiles, mockReviewsByUser, mockPets } from '@/api/mocks/data';
import { isUuidString } from '@/shared/lib/isUuid';
import { resolveMediaUrl, userProfileAvatarProxyUrl, userProfileGalleryProxyUrl } from '@/shared/lib/mediaUrl';

/** Только явный флаг: URL API по умолчанию непустой (`getApiBaseUrl`), иначе медиа резолвились бы относительно фронта. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Режим демо-данных без бэкенда. */
export function isApiMocksMode(): boolean {
  return USE_MOCKS;
}

/** Публичный `/users/{id}/…` допустим только с UUID из API (в режиме моков ключи профилей — любые строки из data.ts). */
export function canFetchPublicUserProfile(userId: string): boolean {
  if (USE_MOCKS) return true;
  return isUuidString(userId);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Num = unknown;

function num(v: Num): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mapRole(role: UserRole): ProfileRole[] {
  switch (role) {
    case 'SEEKER':
      return ['seeker'];
    case 'SITTER':
      return ['sitter'];
    case 'BOTH':
      return ['both'];
    default:
      return ['seeker'];
  }
}

/** Преобразование UserProfileDto → PublicProfile (публичные и «мои» ответы). */
function mapProfile(dto: UserProfileDto): PublicProfile {
  const base = getApiBaseUrl();
  const rawGallery = (dto.galleryUrls ?? []).filter(Boolean) as string[];
  if (USE_MOCKS) {
    return {
      id: dto.id,
      displayName: dto.displayName ?? '',
      avatarUrl: resolveMediaUrl(dto.avatarUrl ?? '', base),
      bio: dto.bio ?? '',
      galleryUrls: rawGallery.map((u) => resolveMediaUrl(u, base)),
      galleryCanonicalUrls: rawGallery,
      roles: mapRole(dto.role),
      ratingAvg: num(dto.ratingAvg) ?? 0,
      reviewCount: dto.reviewCount ?? 0,
    };
  }
  const hasAvatar = Boolean(dto.avatarUrl?.trim());
  return {
    id: dto.id,
    displayName: dto.displayName ?? '',
    avatarUrl: hasAvatar ? userProfileAvatarProxyUrl(dto.id, base, dto.avatarUrl!) : '',
    bio: dto.bio ?? '',
    galleryUrls: rawGallery.map((u, i) => userProfileGalleryProxyUrl(dto.id, i, base, u)),
    galleryCanonicalUrls: rawGallery,
    roles: mapRole(dto.role),
    ratingAvg: num(dto.ratingAvg) ?? 0,
    reviewCount: dto.reviewCount ?? 0,
  };
}

/** Преобразование ReviewDto → Review */
function mapReview(dto: ReviewDto): Review {
  return {
    id: dto.id,
    authorId: dto.authorId,
    authorName: dto.authorName,
    rating: dto.rating,
    text: dto.text,
    createdAt: dto.createdAt,
  };
}

/** Элемент страницы ленты → Listing */
function mapListingShort(dto: ListingShortDto): Listing {
  const base = getApiBaseUrl();
  return {
    id: dto.id,
    authorId: dto.authorId,
    kind: dto.kind === 'OFFER_SITTER' ? 'offer_sitter' : 'need_sitter',
    title: dto.title,
    description: '',
    city: dto.city,
    priceRubPerDay: num(dto.pricePerDay),
    periodText: '—',
    coverImageUrl: resolveMediaUrl(dto.coverUrl ?? '', base),
    authorPreview: {
      displayName: dto.authorName ?? 'Пользователь',
      avatarUrl: USE_MOCKS
        ? resolveMediaUrl(dto.authorAvatarUrl ?? '', base)
        : dto.authorAvatarUrl?.trim()
          ? userProfileAvatarProxyUrl(dto.authorId, base, dto.authorAvatarUrl!)
          : '',
      ratingAvg: num(dto.authorRating) ?? 0,
      reviewCount: 0,
    },
  };
}

/** Построение query-строки из параметров */
function buildQuery(params: ListingsQueryParams): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

/** Получение списка объявлений */
export async function fetchListings(params: ListingsQueryParams = {}): Promise<{ items: Listing[]; total: number }> {
  if (USE_MOCKS) {
    await delay(280);
    return { items: [...mockListings], total: mockListings.length };
  }

  const query = buildQuery(params);
  const page = await apiGet<Page<ListingShortDto>>(`/listings${query}`, false);
  return {
    items: page.content.map(mapListingShort),
    total: page.totalElements,
  };
}

/** Получение объявления по ID */
export async function fetchListingById(id: string): Promise<Listing | undefined> {
  if (USE_MOCKS) {
    await delay(200);
    const found = mockListings.find((l) => l.id === id);
    if (!found) return undefined;
    const embeddedAuthor = mockProfiles[found.authorId];
    return embeddedAuthor ? { ...found, embeddedAuthor } : found;
  }

  try {
    const dto = await apiGet<ListingDetailDto>(`/listings/${id}`, false);
    return mapListingDetailDtoToListing(dto);
  } catch {
    return undefined;
  }
}

/** Профиль текущего пользователя: `GET /me/profile` с Bearer */
export async function fetchMyProfile(): Promise<PublicProfile | undefined> {
  if (USE_MOCKS) {
    await delay(220);
    const id = getStoredSession()?.userId;
    if (!id) return undefined;
    return mockProfiles[id];
  }

  try {
    const dto = await apiGet<UserProfileDto>('/me/profile');
    return mapProfile(dto);
  } catch {
    return undefined;
  }
}

/** Отзывы о текущем пользователе */
export async function fetchMyReviews(): Promise<Review[]> {
  if (USE_MOCKS) {
    await delay(180);
    const id = getStoredSession()?.userId;
    if (!id) return [];
    return mockReviewsByUser[id] ?? [];
  }

  try {
    const dtos = await apiGet<ReviewDto[]>('/me/reviews');
    return dtos.map(mapReview);
  } catch {
    return [];
  }
}

/** Карточки питомцев текущего пользователя */
export async function fetchMyPets(): Promise<PetCard[]> {
  if (USE_MOCKS) {
    await delay(150);
    const id = getStoredSession()?.userId;
    if (!id) return [];
    return mockPets[id] ?? [];
  }

  try {
    const dtos = await apiGet<PetCardDto[]>('/me/pets');
    return dtos.map(mapPetDto);
  } catch {
    return [];
  }
}

/** Получение публичного профиля по userId (только UUID к реальному API) */
export async function fetchProfile(userId: string): Promise<PublicProfile | undefined> {
  if (USE_MOCKS) {
    await delay(220);
    return mockProfiles[userId];
  }

  if (!isUuidString(userId)) return undefined;

  try {
    const dto = await apiGet<UserProfileDto>(`/users/${userId}/profile`, false);
    return mapProfile(dto);
  } catch {
    return undefined;
  }
}

/** Публичные отзывы по userId */
export async function fetchReviews(userId: string): Promise<Review[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockReviewsByUser[userId] ?? [];
  }

  if (!isUuidString(userId)) return [];

  try {
    const dtos = await apiGet<ReviewDto[]>(`/users/${userId}/reviews`, false);
    return dtos.map(mapReview);
  } catch {
    return [];
  }
}

/** Публичные карточки питомцев по userId */
export async function fetchPets(userId: string): Promise<PetCard[]> {
  if (USE_MOCKS) {
    await delay(150);
    return mockPets[userId] ?? [];
  }

  if (!isUuidString(userId)) return [];

  try {
    const dtos = await apiGet<PetCardDto[]>(`/users/${userId}/pets`, false);
    return dtos.map(mapPetDto);
  } catch {
    return [];
  }
}
