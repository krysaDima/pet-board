/** Тип объявления на доске. */
export type ListingKind = 'offer_sitter' | 'need_sitter';

/** Объявление в ленте. */
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
  /** Если заказчик привязал питомца к объявлению */
  petId?: string;
};
