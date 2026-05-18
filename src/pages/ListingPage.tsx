import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { fetchListingById, fetchProfile, canFetchPublicUserProfile, isApiMocksMode } from '@/api/listingsApi';
import { mockProfiles } from '@/api/mocks/data';
import { useAuth } from '@/app/auth/AuthContext';
import { useChatStore } from '@/app/chat/ChatProvider';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { StarsRating } from '@/shared/ui/StarsRating';
import { Avatar } from '@/shared/ui/Avatar';

function kindLabel(kind: 'offer_sitter' | 'need_sitter'): string {
  return kind === 'offer_sitter' ? 'Предлагаю передержку' : 'Нужна передержка';
}

/** Карточка объявления + действие «Написать». */
export function ListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userId: authUserId } = useAuth();
  const { ensureThreadWith } = useChatStore();

  const listingQuery = useQuery({
    queryKey: listingId ? queryKeys.listing(listingId) : queryKeys.listing('__skip__'),
    queryFn: () => fetchListingById(listingId!),
    enabled: Boolean(listingId),
  });

  const authorId = listingQuery.data?.authorId;

  const authorQuery = useQuery({
    queryKey: authorId ? queryKeys.profile(authorId) : queryKeys.profile('__skip__'),
    queryFn: () => fetchProfile(authorId!),
    enabled: Boolean(
      listingQuery.data &&
        listingQuery.data.authorId &&
        canFetchPublicUserProfile(listingQuery.data.authorId) &&
        !listingQuery.data.embeddedAuthor,
    ),
  });

  if (!listingId) return <p className="text-stone-600">Объявление не найдено.</p>;
  if (listingQuery.isPending) return <p className="text-stone-600">Загрузка…</p>;
  if (listingQuery.isError || !listingQuery.data) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">Объявление не найдено.</p>
        <Link to={ROUTES.board} className="inline-flex min-h-[44px] items-center text-amber-700 underline">
          К списку объявлений
        </Link>
      </div>
    );
  }

  const listing = listingQuery.data;
  const author = listing.embeddedAuthor ?? authorQuery.data ?? mockProfiles[listing.authorId];
  const isOwn = isAuthenticated && authUserId != null && listing.authorId === authUserId;

  const onWrite = () => {
    if (isOwn) return;
    const chatId = ensureThreadWith(listing.authorId);
    navigate(ROUTES.chatThread(chatId));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Link
        to={ROUTES.board}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
      >
        ← К объявлениям
      </Link>
      <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="aspect-[4/3] max-h-72 w-full overflow-hidden sm:aspect-[21/9] sm:max-h-80">
          <img src={listing.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="space-y-4 p-4 sm:p-8">
          <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            {kindLabel(listing.kind)}
          </span>
          <h1 className="text-xl font-bold leading-snug text-stone-900 sm:text-3xl">{listing.title}</h1>
          <p className="text-stone-700">{listing.description}</p>
          <dl className="grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-stone-500">Город</dt>
              <dd>{listing.city}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-500">Срок</dt>
              <dd>{listing.periodText}</dd>
            </div>
            {listing.priceRubPerDay != null ? (
              <div>
                <dt className="font-medium text-stone-500">Цена</dt>
                <dd>{listing.priceRubPerDay} ₽ / сутки</dd>
              </div>
            ) : null}
          </dl>

          {author ? (
            <Card className="border-stone-100 bg-stone-50/80 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Link to={ROUTES.profile(author.id)} className="shrink-0 touch-manipulation">
                    <Avatar src={author.avatarUrl} alt={author.displayName} size="lg" mediaAuthFallback={!isApiMocksMode()} />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to={ROUTES.profile(author.id)}
                      className="text-base font-semibold text-stone-900 hover:text-amber-800 sm:text-lg"
                    >
                      {author.displayName}
                    </Link>
                    <StarsRating ratingAvg={author.ratingAvg} reviewCount={author.reviewCount} />
                  </div>
                </div>
                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={isOwn}
                    onClick={onWrite}
                    title={isOwn ? 'Это ваше объявление' : undefined}
                  >
                    {isOwn ? 'Это вы' : 'Написать'}
                  </Button>
                ) : (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                    <p className="text-center text-xs text-stone-500 sm:text-right">
                      Войдите, чтобы написать автору объявления.
                    </p>
                    <Link
                      to={ROUTES.auth}
                      state={{ from: location.pathname }}
                      className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:w-auto sm:min-h-0 sm:py-2"
                    >
                      Авторизоваться
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      </article>
    </div>
  );
}
