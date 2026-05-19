import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { fetchListingById, fetchProfile, canFetchPublicUserProfile, isApiMocksMode } from '@/api/listingsApi';
import { mockProfiles } from '@/api/mocks/data';
import { useAuth } from '@/app/auth/AuthContext';
import { useBlockedUsers } from '@/app/block/BlockedUsersProvider';
import { useAppNotice } from '@/app/notice/AppNoticeProvider';
import { useChatStore } from '@/app/chat/ChatProvider';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { StarsRating } from '@/shared/ui/StarsRating';
import { Avatar } from '@/shared/ui/Avatar';
import { AuthAwareImg } from '@/shared/ui/AuthAwareImg';
import { useFavorites } from '@/shared/lib/useFavorites';

function kindLabel(kind: 'offer_sitter' | 'need_sitter'): string {
  return kind === 'offer_sitter' ? 'Предлагаю передержку' : 'Нужна передержка';
}

/** Карточка объявления + действие «Написать». */
export function ListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnToChatId = (location.state as { returnToChatId?: string } | null)?.returnToChatId;
  const { isAuthenticated, userId: authUserId } = useAuth();
  const { ensureThreadWith } = useChatStore();
  const { isUserHidden } = useBlockedUsers();
  const notice = useAppNotice();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

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
  if (listingQuery.isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-stone-600">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
        <p className="text-sm font-medium">Загрузка объявления…</p>
      </div>
    );
  }
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
  const isFav = isFavorite(listing.id);

  const onWrite = async () => {
    if (isOwn) return;
    if (isUserHidden(listing.authorId)) {
      notice.error('Написать нельзя', 'Этот пользователь заблокирован.');
      return;
    }
    try {
      const chatId = await ensureThreadWith(listing.authorId, listing.id);
      navigate(ROUTES.chatThread(chatId));
    } catch {
      notice.error('Не удалось открыть чат', 'Возможно, пользователь заблокирован.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        {returnToChatId ? (
          <Link
            to={ROUTES.chatThread(returnToChatId)}
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
          >
            ← Вернуться в чат
          </Link>
        ) : (
          <Link
            to={ROUTES.board}
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
          >
            ← К объявлениям
          </Link>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(listing.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition hover:scale-105 ${
              isFav
                ? 'border-red-200 bg-red-50 text-red-500'
                : 'border-stone-200 bg-white text-stone-400 hover:text-red-400'
            }`}
            aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <svg
              className={`h-5 w-5 ${isFav ? 'fill-current' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-700"
            aria-label="Поделиться"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          </button>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="relative aspect-[4/3] max-h-96 w-full overflow-hidden sm:aspect-[21/9]">
          {listing.coverImageUrl ? (
            <AuthAwareImg
              src={listing.coverImageUrl}
              alt={listing.title ? `Обложка: ${listing.title}` : 'Обложка объявления'}
              className="h-full w-full object-cover"
              loading="eager"
              mediaAuthFallback={!isApiMocksMode()}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
              <span className="text-6xl text-stone-300">📷</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 sm:p-6">
            <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900 shadow backdrop-blur-sm">
              {kindLabel(listing.kind)}
            </span>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold leading-snug text-stone-900 sm:text-3xl">{listing.title}</h1>
            {listing.priceRubPerDay != null && (
              <p className="text-2xl font-bold text-amber-700">
                {listing.priceRubPerDay.toLocaleString('ru-RU')} ₽ <span className="text-base font-medium text-stone-500">/ сутки</span>
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoBlock icon="📍" label="Город" value={listing.city || 'Не указан'} />
            <InfoBlock icon="📅" label="Период" value={listing.periodText || 'По договорённости'} />
            {listing.contactPhone && (
              <InfoBlock icon="📞" label="Телефон" value={listing.contactPhone} isLink={`tel:${listing.contactPhone.replace(/\D/g, '')}`} />
            )}
            {listing.contactTelegram && (
              <InfoBlock
                icon="💬"
                label="Telegram"
                value={listing.contactTelegram}
                isLink={`https://t.me/${listing.contactTelegram.replace('@', '')}`}
              />
            )}
          </div>

          {listing.description && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Описание</h2>
              <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {listing.conditions && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Условия содержания</h2>
              <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{listing.conditions}</p>
            </div>
          )}

          {listing.experience && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Опыт</h2>
              <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{listing.experience}</p>
            </div>
          )}

          {author && (
            <Card className="border-stone-100 bg-gradient-to-br from-stone-50 to-amber-50/30 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Link to={ROUTES.profile(author.id)} className="shrink-0 touch-manipulation">
                    <Avatar
                      src={author.avatarUrl}
                      alt={author.displayName}
                      size="lg"
                      priority
                      mediaAuthFallback={!isApiMocksMode()}
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to={ROUTES.profile(author.id)}
                      className="text-lg font-semibold text-stone-900 hover:text-amber-800 transition"
                    >
                      {author.displayName}
                    </Link>
                    <StarsRating ratingAvg={author.ratingAvg} reviewCount={author.reviewCount} />
                    <p className="mt-1 text-xs text-stone-500">Посмотреть профиль →</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  {isAuthenticated ? (
                    <Button
                      variant="primary"
                      className="w-full sm:w-auto"
                      disabled={isOwn}
                      onClick={onWrite}
                      title={isOwn ? 'Это ваше объявление' : undefined}
                    >
                      {isOwn ? 'Это ваше объявление' : 'Написать автору'}
                    </Button>
                  ) : (
                    <>
                      <p className="text-xs text-stone-500 sm:text-right">
                        Войдите, чтобы написать автору
                      </p>
                      <Link
                        to={ROUTES.auth}
                        state={{ from: location.pathname }}
                        className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:w-auto sm:min-h-0"
                      >
                        Авторизоваться
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </article>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
  isLink,
}: {
  icon: string;
  label: string;
  value: string;
  isLink?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <p className={`font-medium text-stone-900 ${isLink ? 'hover:text-amber-700 transition' : ''}`}>{value}</p>
      </div>
    </div>
  );

  if (isLink) {
    return (
      <a href={isLink} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
