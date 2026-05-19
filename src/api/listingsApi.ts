import type { Listing } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { PublicProfile, Review } from '@/entities/user/model/types';
import type { ListingDetailDto, ListingShortDto, Page, PetCardDto, ReviewDto, UserProfileDto, ListingsQueryParams, UserRole, CreateReviewBody, CreateDirectReviewBody } from '@/api/types';
import type { ProfileRole } from '@/entities/user/model/types';
import { apiGet, apiPost, apiPut, apiDelete, getApiBaseUrl, getStoredSession } from '@/api/client';
import { mapListingDetailDtoToListing, mapPetDto } from '@/api/meApi';
import { mockListings, mockProfiles, mockReviewsByUser, mockPets } from '@/api/mocks/data';
import { isUuidString } from '@/shared/lib/isUuid';
import { resolveMediaUrl, userProfileAvatarProxyUrl, userProfileGalleryProxyUrl, listingCoverProxyUrl } from '@/shared/lib/mediaUrl';
import { generateUniqueId } from '@/shared/lib/generateId';

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
  const nestedAuthor = (dto as ReviewDto & { author?: { id?: string; displayName?: string | null } }).author;
  return {
    id: dto.id,
    authorId: dto.authorId ?? nestedAuthor?.id ?? '',
    authorName: dto.authorName ?? nestedAuthor?.displayName ?? 'Пользователь',
    rating: dto.rating,
    text: dto.text ?? '',
    createdAt: dto.createdAt,
  };
}

/** Элемент страницы ленты → Listing */
function mapListingShort(dto: ListingShortDto): Listing {
  const base = getApiBaseUrl();
  const hasCover = Boolean(dto.coverUrl?.trim());
  return {
    id: dto.id,
    authorId: dto.authorId,
    kind: dto.kind === 'OFFER_SITTER' ? 'offer_sitter' : 'need_sitter',
    title: dto.title,
    description: '',
    city: dto.city,
    priceRubPerDay: num(dto.pricePerDay),
    periodText: '—',
    coverImageUrl: USE_MOCKS
      ? resolveMediaUrl(dto.coverUrl ?? '', base)
      : hasCover
        ? listingCoverProxyUrl(dto.id, base, dto.coverUrl!)
        : '',
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
    const existing = mockProfiles[id];
    if (existing) return existing;
    // Для mock режима создаём временный профиль если userId не в демо-данных
    const fallbackProfile: PublicProfile = {
      id,
      displayName: 'Пользователь',
      avatarUrl: '',
      bio: '',
      galleryUrls: [],
      roles: ['seeker'],
      ratingAvg: 0,
      reviewCount: 0,
    };
    mockProfiles[id] = fallbackProfile;
    return fallbackProfile;
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
    const existing = mockProfiles[userId];
    if (existing) return existing;
    // В mock режиме создаём заглушку для неизвестных пользователей
    if (isUuidString(userId)) {
      const fallbackProfile: PublicProfile = {
        id: userId,
        displayName: 'Пользователь',
        avatarUrl: '',
        bio: '',
        galleryUrls: [],
        roles: ['seeker'],
        ratingAvg: 0,
        reviewCount: 0,
      };
      mockProfiles[userId] = fallbackProfile;
      return fallbackProfile;
    }
    return undefined;
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
    const page = await apiGet<Page<ReviewDto>>(`/users/${userId}/reviews`, false);
    return page.content.map(mapReview);
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

/** Публичные объявления пользователя (только опубликованные) */
export async function fetchUserListings(userId: string): Promise<Listing[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockListings.filter((l) => l.authorId === userId);
  }

  if (!isUuidString(userId)) return [];

  try {
    const page = await apiGet<Page<ListingShortDto>>(`/users/${userId}/listings`, false);
    return page.content.map(mapListingShort);
  } catch {
    return [];
  }
}

/** Создание отзыва (требует завершённого бронирования) */
export async function createReview(body: CreateReviewBody): Promise<Review> {
  if (USE_MOCKS) {
    await delay(300);
    const session = getStoredSession();
    const authorId = session?.userId ?? 'mock-user';
    const author = mockProfiles[authorId];
    const newReview: Review = {
      id: generateUniqueId('review'),
      authorId,
      authorName: author?.displayName ?? 'Пользователь',
      rating: body.rating,
      text: body.text ?? '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    return newReview;
  }

  const dto = await apiPost<ReviewDto>('/reviews', body, true);
  return mapReview(dto);
}

/** Создание отзыва напрямую пользователю (для демо без бронирования) */
export async function createDirectReview(body: CreateDirectReviewBody): Promise<Review> {
  if (USE_MOCKS) {
    await delay(300);
    const session = getStoredSession();
    const authorId = session?.userId ?? 'mock-user';
    const author = mockProfiles[authorId];
    const newReview: Review = {
      id: generateUniqueId('review'),
      authorId,
      authorName: author?.displayName ?? 'Пользователь',
      rating: body.rating,
      text: body.text ?? '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (mockReviewsByUser[body.targetUserId]) {
      mockReviewsByUser[body.targetUserId].unshift(newReview);
    } else {
      mockReviewsByUser[body.targetUserId] = [newReview];
    }
    return newReview;
  }

  const dto = await apiPost<ReviewDto>('/reviews/direct', body, true);
  return mapReview(dto);
}

/** Обновление отзыва (только автор может редактировать) */
export async function updateReview(reviewId: string, targetUserId: string, body: { rating: number; text?: string }): Promise<Review> {
  if (USE_MOCKS) {
    await delay(300);
    const session = getStoredSession();
    const authorId = session?.userId ?? 'mock-user';
    const reviews = mockReviewsByUser[targetUserId];
    if (!reviews) throw new Error('Отзывы не найдены');
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) throw new Error('Отзыв не найден');
    if (reviews[idx].authorId !== authorId) throw new Error('Вы не можете редактировать этот отзыв');
    reviews[idx] = {
      ...reviews[idx],
      rating: body.rating,
      text: body.text ?? '',
    };
    return reviews[idx];
  }

  const dto = await apiPut<ReviewDto>(`/reviews/${reviewId}`, body);
  return mapReview(dto);
}

/** Удаление отзыва (только автор может удалить) */
export async function deleteReview(reviewId: string, targetUserId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(200);
    const session = getStoredSession();
    const authorId = session?.userId ?? 'mock-user';
    const reviews = mockReviewsByUser[targetUserId];
    if (!reviews) return;
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return;
    if (reviews[idx].authorId !== authorId) throw new Error('Вы не можете удалить этот отзыв');
    reviews.splice(idx, 1);
    return;
  }

  await apiDelete(`/reviews/${reviewId}`);
}
