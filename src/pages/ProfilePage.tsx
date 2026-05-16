import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { fetchPets, fetchProfile, fetchReviews } from '@/api/listingsApi';
import { MOCK_CURRENT_USER_ID } from '@/api/mocks/data';
import { useAuth } from '@/app/auth/AuthContext';
import { useChatStore } from '@/app/chat/ChatProvider';
import { ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/lib/queryKeys';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { StarsRating } from '@/shared/ui/StarsRating';
import { Avatar } from '@/shared/ui/Avatar';

/** Профиль пользователя: о себе, питомцы (если есть), отзывы. */
export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { ensureThreadWith } = useChatStore();
  const [tab, setTab] = useState<'about' | 'pets' | 'reviews'>('about');

  const profileQuery = useQuery({
    queryKey: userId ? queryKeys.profile(userId) : queryKeys.profile('__skip__'),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  });

  const reviewsQuery = useQuery({
    queryKey: userId ? queryKeys.reviews(userId) : queryKeys.reviews('__skip__'),
    queryFn: () => fetchReviews(userId!),
    enabled: Boolean(userId),
  });

  const petsQuery = useQuery({
    queryKey: userId ? queryKeys.pets(userId) : queryKeys.pets('__skip__'),
    queryFn: () => fetchPets(userId!),
    enabled: Boolean(userId),
  });

  if (!userId) return <p className="text-stone-600">Пользователь не указан.</p>;
  if (profileQuery.isPending) return <p className="text-stone-600">Загрузка профиля…</p>;
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="space-y-3">
        <p className="text-red-700">Профиль не найден.</p>
        <div className="flex flex-wrap gap-4">
          <Link to={ROUTES.home} className="text-amber-800 underline">
            На главную
          </Link>
          <Link to={ROUTES.board} className="text-amber-800 underline">
            К объявлениям
          </Link>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const isOwn = isAuthenticated && profile.id === MOCK_CURRENT_USER_ID;
  const pets = petsQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];
  const showPets = pets.length > 0 || profile.roles.includes('seeker') || profile.roles.includes('both');

  const onWrite = () => {
    if (isOwn) return;
    const id = ensureThreadWith(profile.id);
    navigate(ROUTES.chatThread(id));
  };

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.board}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
      >
        ← К объявлениям
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar src={profile.avatarUrl} alt={profile.displayName} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <h1 className="text-xl font-bold leading-tight text-stone-900 sm:text-2xl">{profile.displayName}</h1>
            {isAuthenticated ? (
              <Button variant="primary" className="w-full sm:w-auto" disabled={isOwn} onClick={onWrite}>
                {isOwn ? 'Это вы' : 'Написать'}
              </Button>
            ) : (
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                <p className="text-xs text-stone-500">Войдите, чтобы написать пользователю.</p>
                <Link
                  to={ROUTES.auth}
                  state={{ from: location.pathname }}
                  className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:min-h-0 sm:py-2"
                >
                  Авторизоваться
                </Link>
              </div>
            )}
          </div>
          <StarsRating ratingAvg={profile.ratingAvg} reviewCount={profile.reviewCount} />
          <p className="text-stone-700">{profile.bio}</p>
        </div>
      </div>

      {profile.galleryUrls.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.galleryUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="h-48 w-full rounded-2xl object-cover ring-1 ring-stone-200"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-stone-200 pb-2 px-1">
        <TabButton active={tab === 'about'} onClick={() => setTab('about')}>
          Обо мне
        </TabButton>
        {showPets ? (
          <TabButton active={tab === 'pets'} onClick={() => setTab('pets')}>
            Питомцы
          </TabButton>
        ) : null}
        <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')}>
          Отзывы ({reviews.length})
        </TabButton>
      </div>

      {tab === 'about' ? (
        <Card>
          <p className="text-stone-700">
            Роли в сервисе:{' '}
            <strong>
              {profile.roles
                .map((r) => (r === 'sitter' ? 'исполнитель передержки' : r === 'seeker' ? 'заказчик' : 'обе роли'))
                .join(', ')}
            </strong>
            .
          </p>
        </Card>
      ) : null}

      {tab === 'pets' && showPets ? (
        <div className="space-y-4">
          {petsQuery.isPending ? <p className="text-stone-600">Загрузка карточек…</p> : null}
          {pets.length === 0 ? (
            <Card>
              <p className="text-stone-600">Пока нет карточек питомцев в демо-данных.</p>
            </Card>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <Card className="h-full space-y-3">
                    <div className="flex gap-3">
                      <Avatar src={pet.avatarUrl} alt={pet.name} size="md" />
                      <div>
                        <h3 className="text-lg font-semibold text-stone-900">{pet.name}</h3>
                        <p className="text-sm text-stone-500">{pet.species}</p>
                      </div>
                    </div>
                    <p className="text-sm text-stone-700">{pet.description}</p>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-stone-500">Привычки</dt>
                        <dd className="text-stone-800">{pet.habits}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-stone-500">Прививки</dt>
                        <dd className="text-stone-800">{pet.vaccinations}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-stone-500">Аллергии</dt>
                        <dd className="text-stone-800">{pet.allergies}</dd>
                      </div>
                      {pet.vetNotes ? (
                        <div>
                          <dt className="font-medium text-stone-500">Заметки ветеринара</dt>
                          <dd className="text-stone-800">{pet.vetNotes}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'reviews' ? (
        <ul className="space-y-3">
          {reviewsQuery.isPending ? <p className="text-stone-600">Загрузка отзывов…</p> : null}
          {reviews.length === 0 ? (
            <Card>
              <p className="text-stone-600">Отзывов пока нет.</p>
            </Card>
          ) : (
            reviews.map((rev) => (
              <li key={rev.id}>
                <Card className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-stone-900">{rev.authorName}</span>
                    <span className="text-amber-600">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <p className="text-stone-700">{rev.text}</p>
                  <p className="text-xs text-stone-400">{rev.createdAt}</p>
                </Card>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition touch-manipulation min-h-[44px] sm:min-h-0 ${
        active ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-100 active:bg-stone-200'
      }`}
    >
      {children}
    </button>
  );
}
