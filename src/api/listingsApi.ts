import type { Listing } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { PublicProfile, Review } from '@/entities/user/model/types';
import type { ListingDto, UserProfileDto, ReviewDto, PetCardDto, Page, ListingsQueryParams } from '@/api/types';
import { apiGet, getApiBaseUrl } from '@/api/client';
import { mockListings, mockProfiles, mockReviewsByUser, mockPets } from '@/api/mocks/data';

const USE_MOCKS = !getApiBaseUrl() || import.meta.env.VITE_USE_MOCKS === 'true';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Преобразование ListingDto → Listing (фронтовой тип) */
function mapListing(dto: ListingDto): Listing {
  return {
    id: dto.id,
    authorId: dto.authorId,
    kind: dto.kind === 'OFFER_SITTER' ? 'offer_sitter' : 'need_sitter',
    title: dto.title,
    description: dto.description,
    city: dto.city,
    priceRubPerDay: dto.priceRubPerDay,
    periodText: dto.periodText,
    coverImageUrl: dto.coverImageUrl,
    petId: dto.petId,
  };
}

/** Преобразование UserProfileDto → PublicProfile */
function mapProfile(dto: UserProfileDto): PublicProfile {
  return {
    id: dto.id,
    displayName: dto.displayName,
    avatarUrl: dto.avatarUrl,
    bio: dto.bio,
    galleryUrls: dto.galleryUrls,
    roles: [dto.role.toLowerCase() as 'sitter' | 'seeker' | 'both'],
    ratingAvg: dto.ratingAvg,
    reviewCount: dto.reviewCount,
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

/** Преобразование PetCardDto → PetCard */
function mapPet(dto: PetCardDto): PetCard {
  return {
    id: dto.id,
    name: dto.name,
    species: dto.species,
    avatarUrl: dto.avatarUrl,
    description: dto.description,
    habits: dto.habits,
    vaccinations: dto.vaccinations,
    allergies: dto.allergies,
    vetNotes: dto.vetNotes,
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
  const page = await apiGet<Page<ListingDto>>(`/listings${query}`, false);
  return {
    items: page.content.map(mapListing),
    total: page.totalElements,
  };
}

/** Получение объявления по ID */
export async function fetchListingById(id: string): Promise<Listing | undefined> {
  if (USE_MOCKS) {
    await delay(200);
    return mockListings.find((l) => l.id === id);
  }

  try {
    const dto = await apiGet<ListingDto>(`/listings/${id}`, false);
    return mapListing(dto);
  } catch {
    return undefined;
  }
}

/** Получение профиля пользователя */
export async function fetchProfile(userId: string): Promise<PublicProfile | undefined> {
  if (USE_MOCKS) {
    await delay(220);
    return mockProfiles[userId];
  }

  try {
    const dto = await apiGet<UserProfileDto>(`/users/${userId}/profile`, false);
    return mapProfile(dto);
  } catch {
    return undefined;
  }
}

/** Получение отзывов пользователя */
export async function fetchReviews(userId: string): Promise<Review[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockReviewsByUser[userId] ?? [];
  }

  try {
    const dtos = await apiGet<ReviewDto[]>(`/users/${userId}/reviews`, false);
    return dtos.map(mapReview);
  } catch {
    return [];
  }
}

/** Получение питомцев пользователя */
export async function fetchPets(userId: string): Promise<PetCard[]> {
  if (USE_MOCKS) {
    await delay(150);
    return mockPets[userId] ?? [];
  }

  try {
    const dtos = await apiGet<PetCardDto[]>(`/users/${userId}/pets`, false);
    return dtos.map(mapPet);
  } catch {
    return [];
  }
}
