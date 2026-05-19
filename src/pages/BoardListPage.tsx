import { useLayoutEffect, useMemo, useRef, useState, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { Link } from 'react-router';
import { fetchListings, isApiMocksMode } from '@/api/listingsApi';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Listing, ListingAuthorPreview } from '@/entities/listing/model/types';
import { mockProfiles } from '@/api/mocks/data';
import { StarsRating } from '@/shared/ui/StarsRating';
import { Avatar } from '@/shared/ui/Avatar';
import { AuthAwareImg } from '@/shared/ui/AuthAwareImg';
import { useFavorites } from '@/shared/lib/useFavorites';

/** Фильтр списка: все / только исполнители / только заказчики. */
export type BoardListingFilter = 'all' | 'offer_sitter' | 'need_sitter';

/** Варианты сортировки */
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
];

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
  const cityListId = useId();
  const [filter, setFilter] = useState<BoardListingFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [cityFilter, setCityFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isFavorite, toggle: toggleFavorite, count: favoritesCount } = useFavorites();

  const filtered = useMemo(() => {
    let result = [...data];

    if (filter !== 'all') {
      result = result.filter((l) => l.kind === filter);
    }

    if (cityFilter.trim()) {
      const cityLower = cityFilter.toLowerCase().trim();
      result = result.filter((l) => l.city.toLowerCase().includes(cityLower));
    }

    const minPrice = priceMin ? parseFloat(priceMin) : null;
    const maxPrice = priceMax ? parseFloat(priceMax) : null;
    if (minPrice !== null && !isNaN(minPrice)) {
      result = result.filter((l) => (l.priceRubPerDay ?? 0) >= minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      result = result.filter((l) => (l.priceRubPerDay ?? Infinity) <= maxPrice);
    }

    if (showOnlyFavorites) {
      result = result.filter((l) => isFavorite(l.id));
    }

    switch (sortOption) {
      case 'price_asc':
        result.sort((a, b) => (a.priceRubPerDay ?? 0) - (b.priceRubPerDay ?? 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.priceRubPerDay ?? 0) - (a.priceRubPerDay ?? 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.authorPreview?.ratingAvg ?? 0) - (a.authorPreview?.ratingAvg ?? 0));
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }, [data, filter, sortOption, cityFilter, priceMin, priceMax, showOnlyFavorites, isFavorite]);

  const filterKey = useMemo(() => filtered.map((l) => l.id).join(','), [filtered]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter !== 'all') count++;
    if (cityFilter.trim()) count++;
    if (priceMin || priceMax) count++;
    return count;
  }, [filter, cityFilter, priceMin, priceMax]);

  const clearFilters = () => {
    setFilter('all');
    setCityFilter('');
    setPriceMin('');
    setPriceMax('');
    setShowOnlyFavorites(false);
  };

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
      <div className="board-hero">
        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-amber-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          На главную
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
              🐾 Передержка питомцев
            </h1>
            <p className="mt-2 text-stone-600">
              {filtered.length} {filtered.length === 1 ? 'объявление' : filtered.length < 5 ? 'объявления' : 'объявлений'}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-4 bg-gradient-to-b from-stone-50/95 via-stone-50/90 to-transparent px-4 pb-4 pt-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex min-h-[44px] touch-manipulation items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'bg-amber-600 text-white shadow-amber-500/25'
                : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h18M7 9h10M10 14h4" strokeLinecap="round" />
            </svg>
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-600">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`inline-flex min-h-[44px] touch-manipulation items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
              showOnlyFavorites
                ? 'bg-red-500 text-white shadow-red-500/25'
                : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50'
            }`}
          >
            <svg className={`h-4 w-4 ${showOnlyFavorites ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favoritesCount > 0 ? `Избранное (${favoritesCount})` : 'Избранное'}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="rounded-full border-0 bg-white py-2 pl-4 pr-10 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Сначала новые</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
              <option value="rating">По рейтингу</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-stone-900/5 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Тип объявления
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} compact>
                    Все
                  </FilterChip>
                  <FilterChip active={filter === 'offer_sitter'} onClick={() => setFilter('offer_sitter')} compact>
                    🏠 Предлагают
                  </FilterChip>
                  <FilterChip active={filter === 'need_sitter'} onClick={() => setFilter('need_sitter')} compact>
                    🔍 Ищут
                  </FilterChip>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Город
                </label>
                <input
                  type="text"
                  list={cityListId}
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Любой город"
                  className="w-full rounded-xl border-0 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 ring-1 ring-stone-200 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
                <datalist id={cityListId}>
                  {CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Цена за сутки, ₽
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="От"
                    className="w-full rounded-xl border-0 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 ring-1 ring-stone-200 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-stone-300">—</span>
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="До"
                    className="w-full rounded-xl border-0 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 ring-1 ring-stone-200 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-200"
                >
                  Сбросить всё
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-stone-900/5">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <span className="text-4xl">{showOnlyFavorites ? '❤️' : '🔍'}</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900">
            {showOnlyFavorites ? 'Избранное пусто' : 'Ничего не найдено'}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            {showOnlyFavorites
              ? 'Добавляйте понравившиеся объявления в избранное, нажав на сердечко'
              : 'Попробуйте изменить параметры поиска или сбросить фильтры'}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow-md"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {filtered.map((listing) => (
            <div key={listing.id} className="listing-row">
              <ListingRow
                listing={listing}
                isFavorite={isFavorite(listing.id)}
                onToggleFavorite={() => toggleFavorite(listing.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
  compact,
}: {
  children: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-manipulation rounded-xl font-semibold transition-all duration-200 ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm sm:min-h-0 sm:py-2'
      } ${
        active
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
          : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 hover:ring-stone-300 active:bg-stone-100'
      }`}
    >
      {children}
    </button>
  );
}

function authorPreviewForRow(listing: Listing): ListingAuthorPreview | undefined {
  if (listing.authorPreview) return listing.authorPreview;
  const profile = mockProfiles[listing.authorId];
  if (!profile) return undefined;
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    ratingAvg: profile.ratingAvg,
    reviewCount: profile.reviewCount,
  };
}

function ListingRow({
  listing,
  isFavorite,
  onToggleFavorite,
}: {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const author = authorPreviewForRow(listing);
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5 transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/10 hover:ring-amber-500/20">
      <div className="flex flex-col sm:flex-row">
        <Link
          to={ROUTES.listing(listing.id)}
          className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-48 sm:w-56 lg:w-64"
        >
          {listing.coverImageUrl ? (
            <AuthAwareImg
              src={listing.coverImageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
              mediaAuthFallback={!isApiMocksMode()}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
              <span className="text-5xl opacity-50">🐾</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm ${
              listing.kind === 'offer_sitter'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-blue-500/90 text-white'
            }`}>
              {listing.kind === 'offer_sitter' ? '🏠 Предлагаю' : '🔍 Ищу'}
            </span>
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <Link to={ROUTES.listing(listing.id)} className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-tight text-stone-900 transition-colors group-hover:text-amber-700 sm:text-xl">
                {listing.title}
              </h2>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                isFavorite
                  ? 'bg-red-50 text-red-500 ring-1 ring-red-200'
                  : 'bg-stone-50 text-stone-400 ring-1 ring-stone-200 hover:bg-red-50 hover:text-red-400 hover:ring-red-200'
              }`}
              aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <svg
                className={`h-5 w-5 transition-transform duration-200 ${isFavorite ? 'fill-current scale-110' : 'hover:scale-110'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          <Link to={ROUTES.listing(listing.id)} className="flex-1">
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-stone-600">{listing.description}</p>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {listing.city}
              </span>
              {listing.priceRubPerDay != null && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  {listing.priceRubPerDay.toLocaleString('ru-RU')} ₽/сутки
                </span>
              )}
              {listing.periodText && listing.periodText !== '—' && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {listing.periodText}
                </span>
              )}
            </div>
          </Link>

          <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
            {author ? (
              <Link to={ROUTES.profile(listing.authorId)} className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">
                <Avatar src={author.avatarUrl} alt={author.displayName} size="sm" mediaAuthFallback={!isApiMocksMode()} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{author.displayName}</p>
                  <StarsRating ratingAvg={author.ratingAvg} reviewCount={author.reviewCount} compact />
                </div>
              </Link>
            ) : (
              <div />
            )}
            <Link
              to={ROUTES.listing(listing.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow-md"
            >
              Подробнее
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
