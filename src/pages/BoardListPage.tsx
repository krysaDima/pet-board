import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { Link } from 'react-router';
import { fetchListings } from '@/api/listingsApi';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Listing } from '@/entities/listing/model/types';
import { formatListingPriceShort } from '@/entities/listing/lib/formatListingPrice';
import { mockProfiles } from '@/api/mocks/data';
import { StarsRating } from '@/shared/ui/StarsRating';
import { Avatar } from '@/shared/ui/Avatar';

/** Фильтр списка: все / только исполнители / только заказчики. */
export type BoardListingFilter = 'all' | 'offer_sitter' | 'need_sitter';

function kindLabel(kind: Listing['kind']): string {
  return kind === 'offer_sitter' ? 'Предлагаю передержку' : 'Нужна передержка';
}

/** Доска объявлений списком (строки с превью), удобно на мобильных. */
export function BoardListPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.listings,
    queryFn: () => fetchListings(),
  });

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-stone-600 sm:py-24">
        <span
          className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600"
          aria-hidden
        />
        <p className="text-sm font-medium">Загружаем объявления…</p>
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-red-700" role="alert">
        Ошибка: {error instanceof Error ? error.message : 'неизвестно'}
      </p>
    );
  }
  if (data == null) {
    return <p className="text-stone-600">Нет данных. Проверьте консоль (F12).</p>;
  }

  return <BoardListContent data={data.items} />;
}

function BoardListContent({ data }: { data: Listing[] }) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<BoardListingFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter((l) => l.kind === filter);
  }, [data, filter]);

  const filterKey = useMemo(() => filtered.map((l) => l.id).join(','), [filtered]);

  useLayoutEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.board-hero', {
        opacity: 0,
        y: mobile ? 12 : 20,
        duration: 0.45,
        ease: 'power2.out',
      });
      gsap.from('.listing-row', {
        opacity: 0,
        x: mobile ? 0 : -20,
        y: mobile ? 16 : 0,
        duration: mobile ? 0.38 : 0.45,
        stagger: mobile ? 0.06 : 0.09,
        ease: 'power2.out',
        delay: 0.05,
      });
    }, el);
    return () => ctx.revert();
  }, [data, filterKey]);

  return (
    <div ref={blockRef} className="space-y-6 sm:space-y-8">
      <div className="board-hero flex flex-col gap-3 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="min-w-0">
          <Link
            to={ROUTES.home}
            className="inline-flex min-h-[44px] items-center text-xs font-semibold uppercase tracking-widest text-amber-800/90 hover:text-amber-700"
          >
            ← На главную
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:mt-3 sm:text-4xl">Передержка</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
            Объявления списком — удобно пролистывать одной рукой.
          </p>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        role="group"
        aria-label="Фильтр объявлений"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Показать</span>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Все
          </FilterChip>
          <FilterChip active={filter === 'offer_sitter'} onClick={() => setFilter('offer_sitter')}>
            Предлагают передержку
          </FilterChip>
          <FilterChip active={filter === 'need_sitter'} onClick={() => setFilter('need_sitter')}>
            Ищут передержку
          </FilterChip>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600">
          Нет объявлений в этой категории. Выберите другой фильтр.
        </p>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {filtered.map((listing) => (
            <li key={listing.id} className="listing-row">
              <ListingRow listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ children, active, onClick }: { children: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-manipulation rounded-xl px-3.5 py-2.5 text-sm font-semibold transition sm:min-h-0 sm:py-2 ${
        active
          ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/40'
          : 'bg-stone-100 text-stone-700 ring-1 ring-stone-200/80 hover:bg-stone-200 active:bg-stone-300'
      }`}
    >
      {children}
    </button>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const author = mockProfiles[listing.authorId];
  return (
    <Link
      to={ROUTES.listing(listing.id)}
      className="group flex touch-manipulation flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/90 p-3 shadow-md shadow-stone-400/10 ring-1 ring-stone-100/90 transition-all duration-300 active:scale-[0.99] max-sm:gap-3 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5 sm:active:scale-100 md:hover:-translate-y-0.5 md:hover:border-amber-200/60 md:hover:shadow-lg md:hover:shadow-amber-900/10"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl sm:aspect-auto sm:h-36 sm:w-44 sm:self-stretch md:w-52">
        <img
          src={listing.coverImageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 max-md:opacity-100 md:group-hover:opacity-100" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/60 sm:px-2.5 sm:text-[11px]">
            {kindLabel(listing.kind)}
          </span>
          <span
            className="shrink-0 text-right text-sm font-bold tabular-nums text-amber-900 sm:text-base"
            title={listing.priceRubPerDay != null ? 'Цена за сутки' : 'Цена в объявлении не указана'}
          >
            {formatListingPriceShort(listing)}
          </span>
        </div>
        <h2 className="text-base font-bold leading-snug text-stone-900 transition-colors sm:text-lg md:group-hover:text-amber-950 md:text-xl">
          {listing.title}
        </h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-stone-600 sm:line-clamp-2">{listing.description}</p>
        <div className="mt-1 flex flex-col gap-3 border-t border-stone-100 pt-3 sm:mt-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:border-0 sm:pt-0">
          {author ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar src={author.avatarUrl} alt={author.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{author.displayName}</p>
                <StarsRating ratingAvg={author.ratingAvg} reviewCount={author.reviewCount} compact />
              </div>
            </div>
          ) : null}
          <span className="self-start rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-600 sm:self-auto">
            {listing.city}
          </span>
        </div>
      </div>
    </Link>
  );
}
