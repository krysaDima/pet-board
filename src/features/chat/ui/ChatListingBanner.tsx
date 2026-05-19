import { Link } from 'react-router';
import type { Listing } from '@/entities/listing/model/types';
import { ROUTES } from '@/shared/config/routes';
import { AuthAwareImg } from '@/shared/ui/AuthAwareImg';
import { isApiMocksMode } from '@/api/listingsApi';

type Props = {
  listing: Listing;
  chatId: string;
};

function kindLabel(kind: Listing['kind']): string {
  return kind === 'offer_sitter' ? 'Предлагаю передержку' : 'Нужна передержка';
}

/** Краткая карточка объявления над перепиской. */
export function ChatListingBanner({ listing, chatId }: Props) {
  return (
    <Link
      to={ROUTES.listing(listing.id)}
      state={{ returnToChatId: chatId }}
      className="flex min-w-0 items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-2.5 transition hover:border-amber-300 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:p-3"
    >
      {listing.coverImageUrl ? (
        <AuthAwareImg
          src={listing.coverImageUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
          mediaAuthFallback={!isApiMocksMode()}
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-2xl sm:h-16 sm:w-16">
          🐾
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/80 sm:text-xs">По объявлению</p>
        <p className="truncate text-sm font-bold text-stone-900 sm:text-base">{listing.title}</p>
        <p className="mt-0.5 truncate text-xs text-stone-600">
          {kindLabel(listing.kind)}
          {listing.city ? ` · ${listing.city}` : ''}
          {listing.priceRubPerDay != null
            ? ` · ${listing.priceRubPerDay.toLocaleString('ru-RU')} ₽/сутки`
            : ''}
        </p>
      </div>
      <span className="shrink-0 text-stone-400" aria-hidden>
        ›
      </span>
    </Link>
  );
}
