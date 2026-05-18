/**
 * Эндпоинты текущего пользователя: `/api/v1/me/*` (профиль, аватар, питомцы, объявления).
 */

import { apiDelete, apiGet, apiPost, apiPostMultipart, apiPut, getApiBaseUrl } from '@/api/client';
import type {
  CreateListingBody,
  CreatePetBody,
  ListingDetailDto,
  PetCardDto,
  UpdateListingBody,
  UpdatePetBody,
  UpdateProfileBody,
  UserProfileDto,
} from '@/api/types';
import { deriveUserRoleFromListings } from '@/shared/lib/deriveUserRoleFromListings';
import type { Listing } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { PublicProfile } from '@/entities/user/model/types';
import { resolveMediaUrl, userProfileAvatarProxyUrl, userProfileGalleryProxyUrl } from '@/shared/lib/mediaUrl';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

function mocksGuard(): void {
  if (USE_MOCKS) throw new Error('Демо-режим: операции сохранения не поддерживаются. Отключите VITE_USE_MOCKS и укажите API.');
}

type Num = unknown;

function num(v: Num): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mapRole(role: UserProfileDto['role']): PublicProfile['roles'] {
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
    avatarUrl: hasAvatar ? userProfileAvatarProxyUrl(dto.id, base) : '',
    bio: dto.bio ?? '',
    galleryUrls: rawGallery.map((_, i) => userProfileGalleryProxyUrl(dto.id, i, base)),
    galleryCanonicalUrls: rawGallery,
    roles: mapRole(dto.role),
    ratingAvg: num(dto.ratingAvg) ?? 0,
    reviewCount: dto.reviewCount ?? 0,
  };
}

/** Маппер ответа объявления (как для публичной карточки, так и `/me/listings`). */
export function mapListingDetailDtoToListing(dto: ListingDetailDto): Listing {
  const base = getApiBaseUrl();
  const embeddedAuthor = dto.author ? mapProfile(dto.author) : undefined;
  return {
    id: dto.id,
    authorId: dto.author?.id ?? '',
    kind: dto.kind === 'OFFER_SITTER' ? 'offer_sitter' : 'need_sitter',
    title: dto.title,
    description: dto.description ?? '',
    city: dto.city,
    priceRubPerDay: num(dto.pricePerDay),
    periodText: dto.periodText ?? '',
    coverImageUrl: resolveMediaUrl(dto.coverUrl ?? '', base),
    petId: dto.pet?.id,
    embeddedAuthor,
    publishStatus: dto.status,
  };
}

export function mapPetDto(dto: PetCardDto): PetCard {
  const base = getApiBaseUrl();
  return {
    id: dto.id,
    name: dto.name,
    species: dto.species ?? '',
    avatarUrl: resolveMediaUrl(dto.avatarUrl ?? '', base),
    description: dto.description ?? '',
    habits: dto.habits ?? '',
    vaccinations: dto.vaccinations ?? '',
    allergies: dto.allergies ?? '',
    vetNotes: dto.vetNotes ?? '',
  };
}

/** Сохранение полей профиля через `PUT /me/profile`. */
export async function updateMyProfile(body: UpdateProfileBody): Promise<PublicProfile> {
  mocksGuard();
  const dto = await apiPut<UserProfileDto>('/me/profile', body);
  return mapProfile(dto);
}

const PET_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
/** Дефолт бекенда `app.profile-media.max-image-bytes` (10 МБ). */
const PROFILE_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

function assertPetImageFile(file: File): void {
  if (!file.size) throw new Error('Файл пустой');
  if (file.size > PET_AVATAR_MAX_BYTES) throw new Error('Файл больше 2 МБ');
  const okType = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const okExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  if (!okType && !(file.type === '' && okExt)) throw new Error('Допустимы только JPEG, PNG или WebP');
}

function assertProfileMediaFile(file: File): void {
  if (!file.size) throw new Error('Файл пустой');
  if (file.size > PROFILE_MEDIA_MAX_BYTES) throw new Error('Изображение больше 10 МБ');
  const okType = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type);
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const okExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  if (!okType && !(file.type === '' && okExt)) throw new Error('Для профиля допустимы JPEG, PNG, WebP и GIF');
}

/** Загрузка своего аватара (`POST /me/profile/avatar`). */
export async function uploadMyProfileAvatar(file: File): Promise<PublicProfile> {
  mocksGuard();
  assertProfileMediaFile(file);
  const fd = new FormData();
  fd.append('file', file);
  const dto = await apiPostMultipart<UserProfileDto>('/me/profile/avatar', fd);
  if (dto) return mapProfile(dto);
  const refreshed = await apiGet<UserProfileDto>('/me/profile');
  return mapProfile(refreshed);
}

/** Удаление своего загруженного аватара на сервере. */
export async function deleteMyProfileAvatar(): Promise<PublicProfile> {
  mocksGuard();
  const dto = await apiDelete<UserProfileDto>('/me/profile/avatar');
  return mapProfile(dto);
}

/** Загрузка изображения в галерею профиля (`POST /me/profile/gallery`, multipart). */
export async function uploadMyProfileGalleryImage(file: File): Promise<PublicProfile> {
  mocksGuard();
  assertProfileMediaFile(file);
  const fd = new FormData();
  fd.append('file', file);
  const dto = await apiPostMultipart<UserProfileDto>('/me/profile/gallery', fd);
  if (dto) return mapProfile(dto);
  const refreshed = await apiGet<UserProfileDto>('/me/profile');
  return mapProfile(refreshed);
}

/** Удаление снимка галереи (`DELETE /me/profile/gallery`); `publicUrl` — как в `galleryCanonicalUrls` с бэкенда. */
export async function deleteMyProfileGalleryImage(publicUrl: string): Promise<PublicProfile> {
  mocksGuard();
  const u = publicUrl.trim();
  if (!u) throw new Error('Не указан URL изображения для удаления');
  const dto = await apiDelete<UserProfileDto>('/me/profile/gallery', { publicUrl: u });
  return mapProfile(dto);
}

export async function createMyPet(body: CreatePetBody): Promise<PetCard> {
  mocksGuard();
  const dto = await apiPost<PetCardDto>('/me/pets', body);
  return mapPetDto(dto);
}

export async function updateMyPet(petId: string, body: UpdatePetBody): Promise<PetCard> {
  mocksGuard();
  const dto = await apiPut<PetCardDto>(`/me/pets/${petId}`, body);
  return mapPetDto(dto);
}

export async function deleteMyPet(petId: string): Promise<void> {
  mocksGuard();
  await apiDelete(`/me/pets/${petId}`);
}

export async function uploadPetAvatar(petId: string, file: File): Promise<PetCard> {
  mocksGuard();
  assertPetImageFile(file);
  const fd = new FormData();
  fd.append('file', file);
  const dto = await apiPostMultipart<PetCardDto>(`/me/pets/${petId}/avatar`, fd);
  if (dto) return mapPetDto(dto);
  const list = await apiGet<PetCardDto[]>('/me/pets');
  const found = list.find((p) => p.id === petId);
  if (found) return mapPetDto(found);
  throw new Error('Сервер не вернул обновлённую карточку питомца. Должен быть JSON в ответе POST …/avatar или актуальный список GET /me/pets.');
}

export async function deletePetAvatar(petId: string): Promise<PetCard> {
  mocksGuard();
  const dto = await apiDelete<PetCardDto>(`/me/pets/${petId}/avatar`);
  return mapPetDto(dto);
}

/** Мои объявления всех статусов. */
export async function fetchMyListings(): Promise<Listing[]> {
  mocksGuard();
  const dtos = await apiGet<ListingDetailDto[]>('/me/listings');
  return dtos.map(mapListingDetailDtoToListing);
}

export async function createMyListing(body: CreateListingBody): Promise<Listing> {
  mocksGuard();
  const dto = await apiPost<ListingDetailDto>('/me/listings', body);
  return mapListingDetailDtoToListing(dto);
}

export async function updateMyListing(listingId: string, body: UpdateListingBody): Promise<Listing> {
  mocksGuard();
  const dto = await apiPut<ListingDetailDto>(`/me/listings/${listingId}`, body);
  return mapListingDetailDtoToListing(dto);
}

export async function publishMyListing(listingId: string): Promise<Listing> {
  mocksGuard();
  const dto = await apiPost<ListingDetailDto>(`/me/listings/${listingId}/publish`, {});
  return mapListingDetailDtoToListing(dto);
}

export async function deleteMyListing(listingId: string): Promise<void> {
  mocksGuard();
  await apiDelete(`/me/listings/${listingId}`);
}

/** Выставить `role` в профиле по текущим объявлениям (черновики учитываются). Без объявлений — запрос не шлём. */
export async function syncMyProfileRoleFromListings(): Promise<PublicProfile | undefined> {
  mocksGuard();
  const listings = await fetchMyListings();
  const role = deriveUserRoleFromListings(listings);
  if (!role) return undefined;
  const dto = await apiPut<UserProfileDto>('/me/profile', { role });
  return mapProfile(dto);
}
