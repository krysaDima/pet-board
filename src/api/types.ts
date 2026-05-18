/**
 * Типы для работы с API бэкенда.
 * Соответствуют OpenAPI спецификации Java-сервера.
 */

/** Роль пользователя в системе передержки */
export type UserRole = 'SITTER' | 'SEEKER' | 'BOTH';

/** Запрос на регистрацию */
export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
};

/** Запрос на вход */
export type LoginRequest = {
  email: string;
  password: string;
};

/** Запрос на обновление токена */
export type RefreshRequest = {
  refreshToken: string;
};

/** Ответ авторизации (регистрация/вход/refresh) */
export type AuthResponse = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

/** Ошибка API (RFC 9457 ProblemDetail) */
export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId?: string;
};

/** Пагинация Spring Data Page */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

/** Параметры запроса списка объявлений */
export type ListingsQueryParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  kind?: 'OFFER_SITTER' | 'NEED_SITTER';
  city?: string;
  priceMin?: number;
  priceMax?: number;
};

/** Тип объявления с бэкенда (UPPER_CASE) */
export type ListingKindApi = 'OFFER_SITTER' | 'NEED_SITTER';

/** Объявление с API — устаревающее имя страницы; для совместимости оставлено как алиас сырого ответа. */
export type ListingDto = ListingDetailDto;

/** Статус объявления (жизненный цикл модерации) */
export type ListingStatusApi = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'EXPIRED';

/** Элемент страницы публичной ленты `GET /listings` */
export type ListingShortDto = {
  id: string;
  kind: ListingKindApi;
  title: string;
  city: string;
  pricePerDay?: number | string | null;
  coverUrl: string;
  status: ListingStatusApi;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  authorRating?: number | string | null;
  createdAt: string;
};

/** Полное объявление `GET /listings/{id}` */
export type ListingDetailDto = {
  id: string;
  kind: ListingKindApi;
  title: string;
  description: string;
  city: string;
  pricePerDay?: number | string | null;
  periodText: string;
  coverUrl: string;
  status: ListingStatusApi;
  author: UserProfileDto;
  pet?: PetCardDto | null;
  createdAt: string;
};

/** Профиль пользователя с API (`UserProfileResponse`) */
export type UserProfileDto = {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  galleryUrls?: string[] | null;
  role: UserRole;
  ratingAvg?: number | string | null;
  reviewCount?: number | null;
  createdAt?: string;
};

/** Отзыв с API */
export type ReviewDto = {
  id: string;
  authorId: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
};

/** Карточка питомца с API */
export type PetCardDto = {
  id: string;
  ownerId: string;
  name: string;
  species?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  habits?: string | null;
  vaccinations?: string | null;
  allergies?: string | null;
  vetNotes?: string | null;
  createdAt?: string;
};

/** Данные сессии для хранения в localStorage */
export type StoredSession = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

/** `PUT /me/profile` — поля опциональны, отправляйте только изменяемые. */
export type UpdateProfileBody = Partial<{
  displayName: string;
  avatarUrl: string;
  bio: string;
  galleryUrls: string[];
  role: UserRole;
}>;

export type CreatePetBody = {
  name: string;
  species?: string;
  avatarUrl?: string;
  description?: string;
  habits?: string;
  vaccinations?: string;
  allergies?: string;
  vetNotes?: string;
};

export type UpdatePetBody = Partial<CreatePetBody>;

export type CreateListingBody = {
  kind: ListingKindApi;
  title: string;
  description?: string;
  city?: string;
  pricePerDay?: number;
  periodText?: string;
  coverUrl?: string;
  petId?: string;
};

export type UpdateListingBody = Partial<Omit<CreateListingBody, 'kind'>>;
