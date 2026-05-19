import type { PublicProfile } from '@/entities/user/model/types';

/** Тип объявления на доске. */
export type ListingKind = 'offer_sitter' | 'need_sitter';

/** Статус объявления из API (модерация и публикация). */
export type ListingPublishStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'EXPIRED';

/** Краткие данные автора из ленты объявлений (без лишних запросов профиля). */
export type ListingAuthorPreview = {
  displayName: string;
  avatarUrl: string;
  ratingAvg: number;
  reviewCount: number;
};

/** Объявление на доске. */
export type Listing = {
  id: string;
  authorId: string;
  kind: ListingKind;
  title: string;
  description: string;
  city: string;
  priceRubPerDay?: number;
  /** Срок или даты — в пробной версии строка */
  periodText: string;
  coverImageUrl: string;
  /** Галерея изображений объявления */
  galleryUrls?: string[];
  /** Если заказчик привязал питомца к объявлению */
  petId?: string;
  /** Из карточки объявления: автор уже в теле ответа */
  embeddedAuthor?: PublicProfile;
  /** Из списка ленты: превью автора */
  authorPreview?: ListingAuthorPreview;
  /** Если пришло из полного ответа API */
  publishStatus?: ListingPublishStatus;
  /** Контактный телефон */
  contactPhone?: string;
  /** Контактный Telegram */
  contactTelegram?: string;
  /** Условия содержания */
  conditions?: string;
  /** Опыт работы с животными */
  experience?: string;
  /** Дата создания */
  createdAt?: string;
  /** Когда опубликовано */
  publishedAt?: string;
  /** Когда автоматически снимется с публикации */
  expiresAt?: string;
};
