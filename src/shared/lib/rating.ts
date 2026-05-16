/**
 * Округление среднего рейтинга для отображения «целых» звёзд (пробное правило).
 * Позже можно заменить на половинные звёзды.
 */
export function roundRatingForStars(value: number): number {
  const clamped = Math.min(5, Math.max(0, value));
  return Math.round(clamped);
}

/** Подпись к рейтингу: число + количество отзывов. */
export function formatReviewLine(ratingAvg: number, reviewCount: number): string {
  const r = ratingAvg.toFixed(1);
  const word =
    reviewCount % 10 === 1 && reviewCount % 100 !== 11
      ? 'отзыв'
      : reviewCount % 10 >= 2 && reviewCount % 10 <= 4 && (reviewCount % 100 < 10 || reviewCount % 100 >= 20)
        ? 'отзыва'
        : 'отзывов';
  return `${r} из 5 · ${reviewCount} ${word}`;
}
