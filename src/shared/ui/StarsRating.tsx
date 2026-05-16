import { formatReviewLine, roundRatingForStars } from '@/shared/lib/rating';

type Props = {
  ratingAvg: number;
  reviewCount: number;
  /** Компактный вид для карточек в ленте */
  compact?: boolean;
};

/**
 * Блок рейтинга: звёзды 0–5 (по округлению) + строка с количеством отзывов.
 */
export function StarsRating({ ratingAvg, reviewCount, compact }: Props) {
  const filled = roundRatingForStars(ratingAvg);
  return (
    <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${compact ? 'text-xs sm:text-sm' : 'text-base'}`}>
      <span className="shrink-0 text-amber-500" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>{i < filled ? '★' : '☆'}</span>
        ))}
      </span>
      <span className="min-w-0 break-words text-stone-600">{formatReviewLine(ratingAvg, reviewCount)}</span>
    </div>
  );
}
