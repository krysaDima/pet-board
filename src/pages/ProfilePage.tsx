import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import {
  fetchMyPets,
  fetchMyProfile,
  fetchMyReviews,
  fetchPets,
  fetchProfile,
  fetchReviews,
  canFetchPublicUserProfile,
  isApiMocksMode,
} from '@/api/listingsApi';
import type { UpdatePetBody } from '@/api/types';
import {
  createMyListing,
  createMyPet,
  deleteMyListing,
  deleteMyPet,
  deleteMyProfileAvatar,
  deleteMyProfileGalleryImage,
  deletePetAvatar,
  fetchMyListings,
  publishMyListing,
  syncMyProfileRoleFromListings,
  updateMyPet,
  updateMyProfile,
  uploadMyProfileAvatar,
  uploadMyProfileGalleryImage,
  uploadPetAvatar,
} from '@/api/meApi';
import { useAuth } from '@/app/auth/AuthContext';
import { useChatStore } from '@/app/chat/ChatProvider';
import type { PublicProfile } from '@/entities/user/model/types';
import type { Listing, ListingPublishStatus } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import { ROUTES } from '@/shared/config/routes';
import { getApiErrorMessage } from '@/shared/lib/apiErrorMessage';
import { queryKeys } from '@/shared/lib/queryKeys';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { StarsRating } from '@/shared/ui/StarsRating';
import { AuthAwareImg } from '@/shared/ui/AuthAwareImg';
import { Avatar } from '@/shared/ui/Avatar';
import { CenterModal } from '@/shared/ui/CenterModal';

/** Максимум фотографий в галерее профиля (ограничение на клиенте). */
const GALLERY_MAX_PHOTOS = 12;

/** Лимит символов в поле «О себе» (как при сохранении на клиенте). */
const PROFILE_BIO_MAX_CHARS = 1000;

/** Подписи статуса объявления для кабинета. */
function listingStatusRu(s: ListingPublishStatus | undefined): string {
  if (!s) return '—';
  const m: Record<ListingPublishStatus, string> = {
    DRAFT: 'Черновик',
    PENDING_REVIEW: 'На проверке',
    PUBLISHED: 'Опубликовано',
    REJECTED: 'Отклонено',
    ARCHIVED: 'Снято',
    EXPIRED: 'Истекло',
  };
  return m[s] ?? s;
}

/**
 * Аватар в кабинете: при наведении или фокусе внутри — «Загрузить изображение» и «Удалить».
 */
function ProfileAvatarHoverActions({
  avatarUrl,
  displayName,
  mediaAuthFallback,
  uploading,
  deleting,
  onFileSelected,
  onDeleteRequest,
}: {
  avatarUrl?: string | null;
  displayName: string;
  mediaAuthFallback: boolean;
  uploading: boolean;
  deleting: boolean;
  onFileSelected: (file: File) => void;
  onDeleteRequest: () => void;
}) {
  const inputId = useId();
  const hasAvatar = Boolean(avatarUrl?.trim());

  return (
    <div className="group relative inline-flex h-24 w-24 shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-white">
      <Avatar
        src={avatarUrl}
        alt={displayName}
        size="lg"
        mediaAuthFallback={mediaAuthFallback}
        className="h-full w-full ring-0 shadow-none"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-stone-900/70 px-1.5 py-2 text-center opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
        role="group"
        aria-label="Действия с аватаром"
      >
        <label
          htmlFor={inputId}
          className={`pointer-events-auto cursor-pointer rounded-lg bg-white px-2 py-1 text-[11px] font-semibold leading-tight text-stone-900 shadow-sm hover:bg-stone-100 ${uploading ? 'opacity-70' : ''}`}
        >
          {uploading ? 'Загрузка…' : 'Загрузить изображение'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onFileSelected(f);
          }}
        />
        <button
          type="button"
          disabled={deleting || !hasAvatar}
          className="pointer-events-auto rounded-lg px-2 py-1 text-[11px] font-semibold leading-tight text-white underline decoration-white/70 underline-offset-2 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
          onClick={onDeleteRequest}
        >
          {deleting ? 'Удаление…' : 'Удалить'}
        </button>
      </div>
    </div>
  );
}

/** Карточка снимка галереи; при `canDelete` — крестик удаления слева сверху. */
function GalleryImageTile({
  src,
  mediaAuthFallback,
  canDelete,
  deleteBusy,
  onDeleteClick,
}: {
  src: string;
  mediaAuthFallback: boolean;
  canDelete: boolean;
  deleteBusy: boolean;
  onDeleteClick: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-stone-200">
      <AuthAwareImg
        src={src}
        alt=""
        className="h-48 w-full max-w-full object-cover"
        mediaAuthFallback={mediaAuthFallback}
        draggable={false}
      />
      {canDelete ? (
        <button
          type="button"
          disabled={deleteBusy}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="absolute left-2 top-2 z-10 flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-stone-900/60 text-white shadow-lg backdrop-blur-[1px] transition hover:bg-stone-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:min-h-0 sm:min-w-0 sm:w-9"
          aria-label="Удалить фото из галереи"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/** Ячейка добавления фото: мягкий градиент, пунктир, плюс с лёгким поворотом при наведении. */
function GalleryAddSlot({
  disabled,
  loading,
  onClick,
  countLabel,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  /** Например «3 / 12» */
  countLabel: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative flex h-48 w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-dashed border-amber-400/55 bg-gradient-to-br from-amber-50 via-white to-orange-50/80 text-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-amber-100/90 transition-all duration-300 hover:border-amber-500/80 hover:shadow-lg hover:shadow-amber-200/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
      aria-label={loading ? 'Загрузка изображения' : 'Добавить фотографию в галерею'}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-40 transition duration-500 group-hover:opacity-70"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(251,191,36,0.35) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(214,211,209,0.45) 0%, transparent 42%)`,
        }}
      />
      <span className="pointer-events-none absolute -right-6 top-6 h-16 w-16 rounded-full bg-amber-300/25 blur-xl transition group-hover:bg-amber-400/35" />
      <span className="pointer-events-none absolute bottom-4 left-4 h-14 w-14 rounded-full bg-orange-200/20 blur-lg transition group-hover:bg-orange-300/30" />

      <span className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-white/90 shadow-md shadow-amber-900/8 ring-2 ring-amber-200/70 transition duration-300 group-hover:scale-[1.06] group-hover:ring-amber-400/90 group-hover:shadow-lg group-hover:shadow-amber-400/20">
        <span className="absolute inset-[3px] rounded-[0.85rem] bg-gradient-to-br from-amber-100/50 to-transparent opacity-0 transition group-hover:opacity-100" />
        {loading ? (
          <span
            className="relative h-8 w-8 animate-spin rounded-full border-[3px] border-amber-200 border-t-amber-600"
            aria-hidden
          />
        ) : (
          <svg
            className="relative h-9 w-9 text-amber-600 transition duration-300 ease-out group-hover:rotate-90 group-hover:text-amber-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </span>

      <span className="relative font-mono text-[11px] font-semibold tracking-wide text-amber-900/55 tabular-nums group-hover:text-amber-900/75">
        {countLabel}
      </span>
      {!loading ? (
        <span className="relative max-w-[11rem] px-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400 group-hover:text-stone-500">
          добавить снимок
        </span>
      ) : null}
    </button>
  );
}

type ProfileModalState =
  | null
  | { kind: 'error'; message: string }
  | {
      kind: 'confirm';
      title: string;
      message: string;
      danger?: boolean;
      confirmLabel?: string;
      onConfirm: () => void;
    };

/** Профиль: витрина и личный кабинет (`/me/*`, аватары multipart, питомцы, мои объявления). */
export function ProfilePage() {
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { isAuthenticated, userId: sessionUserId } = useAuth();
  const { ensureThreadWith } = useChatStore();
  const [tab, setTab] = useState<'about' | 'pets' | 'reviews' | 'listings'>('about');
  const [modal, setModal] = useState<ProfileModalState>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const galleryStripRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{
    displayName: string;
    bio: string;
  } | null>(null);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  /** Режим правления полей профиля (по умолчанию — только просмотр). */
  const [editingProfile, setEditingProfile] = useState(false);

  const isMineRoute = routeUserId === undefined;
  const publicKeyOk = Boolean(routeUserId && canFetchPublicUserProfile(routeUserId));

  const profileQuery = useQuery({
    queryKey: isMineRoute ? queryKeys.myProfile(sessionUserId ?? '') : queryKeys.profile(routeUserId!),
    queryFn: () => (isMineRoute ? fetchMyProfile() : fetchProfile(routeUserId!)),
    enabled: isMineRoute ? Boolean(sessionUserId) : Boolean(routeUserId && publicKeyOk),
  });

  const reviewsQuery = useQuery({
    queryKey: isMineRoute ? queryKeys.myReviews(sessionUserId ?? '') : queryKeys.reviews(routeUserId!),
    queryFn: () => (isMineRoute ? fetchMyReviews() : fetchReviews(routeUserId!)),
    enabled: isMineRoute ? Boolean(sessionUserId) : Boolean(routeUserId && publicKeyOk),
  });

  const petsQuery = useQuery({
    queryKey: isMineRoute ? queryKeys.myPets(sessionUserId ?? '') : queryKeys.pets(routeUserId!),
    queryFn: () => (isMineRoute ? fetchMyPets() : fetchPets(routeUserId!)),
    enabled: isMineRoute ? Boolean(sessionUserId) : Boolean(routeUserId && publicKeyOk),
  });

  const myListingsQuery = useQuery({
    queryKey: queryKeys.myListings(sessionUserId ?? ''),
    queryFn: fetchMyListings,
    enabled: Boolean(isMineRoute && sessionUserId && tab === 'listings' && !isApiMocksMode()),
  });

  const clearModal = () => setModal(null);
  const showError = (message: string) => setModal({ kind: 'error', message });
  const showConfirm = (opts: Omit<Extract<ProfileModalState, { kind: 'confirm' }>, 'kind'>) =>
    setModal({ kind: 'confirm', ...opts });

  const profile = profileQuery.data;
  const invalidateMine = () => {
    if (sessionUserId) {
      void qc.invalidateQueries({ queryKey: queryKeys.myProfile(sessionUserId) });
      void qc.invalidateQueries({ queryKey: queryKeys.myPets(sessionUserId) });
      void qc.invalidateQueries({ queryKey: queryKeys.myListings(sessionUserId) });
    }
    void qc.invalidateQueries({ queryKey: queryKeys.listings });
  };

  /** После изменения объявлений подтягиваем роль в профиле с бэкенда по типам черновиков/объявлений. */
  const afterListingChanged = async () => {
    try {
      await syncMyProfileRoleFromListings();
    } catch (e: unknown) {
      showError(getApiErrorMessage(e));
    }
    invalidateMine();
  };

  const saveProfileMut = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      clearModal();
      invalidateMine();
      setEditingProfile(false);
      setDraft(null);
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const uploadAvatarMut = useMutation({
    mutationFn: uploadMyProfileAvatar,
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const deleteAvatarMut = useMutation({
    mutationFn: deleteMyProfileAvatar,
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const createPetMut = useMutation({
    mutationFn: createMyPet,
    onSuccess: () => {
      clearModal();
      setNewPetName('');
      setNewPetSpecies('');
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const updatePetMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateMyPet>[1] }) => updateMyPet(id, body),
    onSuccess: () => {
      clearModal();
      setEditingPetId(null);
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const deletePetMut = useMutation({
    mutationFn: deleteMyPet,
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const uploadPetAvatarMut = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadPetAvatar(id, file),
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const createListingMut = useMutation({
    mutationFn: createMyListing,
    onSuccess: async () => {
      clearModal();
      await afterListingChanged();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const publishListingMut = useMutation({
    mutationFn: publishMyListing,
    onSuccess: async () => {
      clearModal();
      await afterListingChanged();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const deleteListingMut = useMutation({
    mutationFn: deleteMyListing,
    onSuccess: async () => {
      clearModal();
      await afterListingChanged();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const deletePetAvatarMut = useMutation({
    mutationFn: deletePetAvatar,
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const deleteGalleryMut = useMutation({
    mutationFn: deleteMyProfileGalleryImage,
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const uploadGalleryMut = useMutation({
    mutationFn: uploadMyProfileGalleryImage,
    onSuccess: () => {
      clearModal();
      invalidateMine();
    },
    onError: (e: unknown) => showError(getApiErrorMessage(e)),
  });

  const galleryPhotoCount = profile?.galleryUrls.length ?? 0;
  const galleryHorizontal = galleryPhotoCount > 2;

  const onGalleryPhotoShellClick = useCallback(
    (photoIndex: number, wrapperEl: HTMLElement, e: MouseEvent<HTMLElement>) => {
      if (!galleryHorizontal) return;
      if ((e.target as HTMLElement).closest('button')) return;
      const strip = galleryStripRef.current;
      if (!strip) return;
      const cr = strip.getBoundingClientRect();
      const wr = wrapperEl.getBoundingClientRect();
      const tol = 28;
      const isLastVisibleToRight = wr.right >= cr.right - tol;
      const isFirstVisibleToLeft = wr.left <= cr.left + tol;
      const isLastPhoto = photoIndex === galleryPhotoCount - 1;
      const isFirstPhoto = photoIndex === 0;

      if (isLastVisibleToRight || isLastPhoto) {
        const next = wrapperEl.nextElementSibling as HTMLElement | null;
        if (next) {
          next.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        } else {
          strip.scrollTo({ left: strip.scrollWidth - strip.clientWidth, behavior: 'smooth' });
        }
        return;
      }

      if (isFirstVisibleToLeft || isFirstPhoto) {
        const prev = wrapperEl.previousElementSibling as HTMLElement | null;
        if (prev) {
          prev.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
        } else {
          strip.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    },
    [galleryHorizontal, galleryPhotoCount],
  );

  const openProfileEdit = () => {
    if (!profile || !isMineRoute) return;
    setDraft({
      displayName: profile.displayName,
      bio: profile.bio.slice(0, PROFILE_BIO_MAX_CHARS),
    });
    setEditingProfile(true);
    clearModal();
  };

  const closeProfileEdit = () => {
    setEditingProfile(false);
    setDraft(null);
    clearModal();
  };

  if (!isMineRoute && routeUserId && !publicKeyOk) {
    return (
      <div className="space-y-3">
        <p className="text-red-700">Некорректная ссылка на профиль: в адресе должен быть UUID пользователя из системы.</p>
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

  if (!isMineRoute && !routeUserId) {
    return <p className="text-stone-600">Пользователь не указан.</p>;
  }

  if (profileQuery.isPending) return <p className="text-stone-600">Загрузка профиля…</p>;
  if (profileQuery.isError || !profile) {
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

  const isOwn = isMineRoute || (Boolean(sessionUserId) && profile.id === sessionUserId);
  const pets = petsQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];
  const showPets = pets.length > 0 || profile.roles.includes('seeker') || profile.roles.includes('both') || isMineRoute;
  const mocks = isApiMocksMode();

  const requestDeleteAvatar = () =>
    showConfirm({
      title: 'Удалить аватар?',
      message: 'Файл будет снят с публикации.',
      danger: true,
      confirmLabel: 'Удалить',
      onConfirm: () => deleteAvatarMut.mutate(),
    });

  const openGalleryFilePicker = () => galleryFileInputRef.current?.click();

  const requestDeleteGalleryAt = (index: number) => {
    const publicUrl = galleryDeletePublicUrl(profile, index);
    showConfirm({
      title: 'Удалить фото?',
      message: 'Снимок будет удалён из галереи.',
      danger: true,
      confirmLabel: 'Удалить',
      onConfirm: () => deleteGalleryMut.mutate(publicUrl),
    });
  };

  const onWrite = () => {
    if (isOwn) return;
    const id = ensureThreadWith(profile.id);
    navigate(ROUTES.chatThread(id));
  };

  const onSaveProfile = () => {
    if (!draft) return;
    /* Без `galleryUrls`: полная замена массива ломает синхрон с Яндекс.Диском для фото из POST /gallery (см. инструкцию бэкенда). */
    saveProfileMut.mutate({
      displayName: draft.displayName,
      bio: draft.bio.trim().slice(0, PROFILE_BIO_MAX_CHARS),
    });
  };

  const galleryShowAddSlot = Boolean(isMineRoute && !mocks && galleryPhotoCount < GALLERY_MAX_PHOTOS);

  const galleryPhotoItems = profile.galleryUrls.map((url, i) => (
    <div
      key={`${url}-${i}`}
      className={
        galleryHorizontal
          ? 'snap-start shrink-0 box-border w-[min(100%,18rem)] cursor-pointer select-none'
          : undefined
      }
      onClick={galleryHorizontal ? (e) => onGalleryPhotoShellClick(i, e.currentTarget, e) : undefined}
    >
      <GalleryImageTile
        src={url}
        mediaAuthFallback={!mocks}
        canDelete={Boolean(isMineRoute && !mocks)}
        deleteBusy={deleteGalleryMut.isPending || uploadGalleryMut.isPending}
        onDeleteClick={() => requestDeleteGalleryAt(i)}
      />
    </div>
  ));

  const galleryAddSlotColumn =
    galleryShowAddSlot ? (
      <div className="relative w-[min(18rem,calc(100vw-6rem))] shrink-0 border-l border-stone-200/80 pl-3 sm:w-72 sm:pl-4">
        <GalleryAddSlot
          disabled={uploadGalleryMut.isPending || deleteGalleryMut.isPending}
          loading={uploadGalleryMut.isPending}
          onClick={openGalleryFilePicker}
          countLabel={`${profile.galleryUrls.length} / ${GALLERY_MAX_PHOTOS}`}
        />
      </div>
    ) : null;

  return (
    <div className="min-w-0 space-y-6">
      <Link
        to={ROUTES.board}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
      >
        ← К объявлениям
      </Link>

      {isMineRoute && !mocks ? (
        <input
          ref={galleryFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          disabled={
            uploadGalleryMut.isPending ||
            deleteGalleryMut.isPending ||
            profile.galleryUrls.length >= GALLERY_MAX_PHOTOS
          }
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) uploadGalleryMut.mutate(f);
          }}
        />
      ) : null}

      <CenterModal
        open={modal !== null}
        title={modal?.kind === 'error' ? 'Ошибка' : modal?.kind === 'confirm' ? modal.title : ''}
        description={modal?.kind === 'error' || modal?.kind === 'confirm' ? modal.message : ''}
        onClose={clearModal}
        confirm={
          modal?.kind === 'confirm'
            ? {
                onConfirm: modal.onConfirm,
                danger: modal.danger,
                label: modal.confirmLabel,
              }
            : undefined
        }
        okLabel="Понятно"
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-start gap-2">
          {isMineRoute && !mocks ? (
            <ProfileAvatarHoverActions
              avatarUrl={profile.avatarUrl}
              displayName={profile.displayName}
              mediaAuthFallback={!mocks}
              uploading={uploadAvatarMut.isPending}
              deleting={deleteAvatarMut.isPending}
              onFileSelected={(file) => uploadAvatarMut.mutate(file)}
              onDeleteRequest={requestDeleteAvatar}
            />
          ) : (
            <Avatar src={profile.avatarUrl} alt={profile.displayName} size="lg" mediaAuthFallback={!mocks} />
          )}
        </div>
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
        </div>
      </div>

      {profile.galleryUrls.length > 0 || (isMineRoute && !mocks) ? (
        <div className="space-y-3">
          {galleryHorizontal ? (
            galleryShowAddSlot ? (
              <div className="flex gap-3 items-stretch">
                <div
                  ref={galleryStripRef}
                  className="flex min-w-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain scroll-pl-1 scroll-pr-2 pb-2 pt-0.5 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
                  role="region"
                  aria-label="Фотографии профиля, прокрутка в сторону"
                >
                  {galleryPhotoItems}
                </div>
                {galleryAddSlotColumn}
              </div>
            ) : (
              <div
                ref={galleryStripRef}
                className="flex gap-3 overflow-x-auto overscroll-x-contain scroll-pl-1 scroll-pr-2 pb-2 pt-0.5 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
                role="region"
                aria-label="Галерея, прокрутка в сторону"
              >
                {galleryPhotoItems}
              </div>
            )
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {galleryPhotoItems}
              {galleryShowAddSlot ? (
                <GalleryAddSlot
                  disabled={uploadGalleryMut.isPending || deleteGalleryMut.isPending}
                  loading={uploadGalleryMut.isPending}
                  onClick={openGalleryFilePicker}
                  countLabel={`${profile.galleryUrls.length} / ${GALLERY_MAX_PHOTOS}`}
                />
              ) : null}
            </div>
          )}
          {isMineRoute && !mocks && profile.galleryUrls.length >= GALLERY_MAX_PHOTOS ? (
            <p className="text-center text-xs font-medium text-amber-800">
              В галерее не более {GALLERY_MAX_PHOTOS} фотографий — удалите снимок, чтобы добавить новый.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-stone-200 px-1 pb-2">
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
        {isMineRoute ? (
          <TabButton active={tab === 'listings'} onClick={() => setTab('listings')}>
            Объявления
          </TabButton>
        ) : null}
      </div>

      {tab === 'about' ? (
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0 space-y-4 overflow-hidden">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-stone-800">О себе</h2>
              {profile.bio.trim() ? (
                <p className="mt-2 min-w-0 max-w-full whitespace-pre-wrap break-words text-stone-700 leading-relaxed [overflow-wrap:anywhere]">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  {isOwn ? 'Добавьте короткое описание в профиле — его увидят другие пользователи.' : 'Пользователь пока не заполнил описание.'}
                </p>
              )}
            </div>
          </Card>
          {isMineRoute && !mocks && !editingProfile ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="primary" type="button" className="w-full sm:w-auto" onClick={openProfileEdit}>
                Редактировать профиль
              </Button>
            </div>
          ) : null}
          {isMineRoute && draft && !mocks && editingProfile ? (
            <Card className="min-w-0 space-y-3 overflow-hidden">
              <h2 className="text-lg font-semibold text-stone-900">Редактирование профиля</h2>
              <label className="block text-sm">
                <span className="font-medium text-stone-600">Имя</span>
                <input
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900"
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                />
              </label>
              <label className="block min-w-0 text-sm">
                <span className="font-medium text-stone-600">О себе</span>
                <textarea
                  id="profile-bio-edit"
                  className="mt-1 min-h-[88px] w-full max-w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 break-words [overflow-wrap:anywhere]"
                  value={draft.bio}
                  maxLength={PROFILE_BIO_MAX_CHARS}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  aria-describedby="profile-bio-counter"
                />
                <span id="profile-bio-counter" className="mt-1 block text-xs text-stone-500">
                  {draft.bio.length} / {PROFILE_BIO_MAX_CHARS}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  type="button"
                  disabled={saveProfileMut.isPending}
                  onClick={onSaveProfile}
                  className="w-full sm:w-auto"
                >
                  {saveProfileMut.isPending ? 'Сохранение…' : 'Сохранить'}
                </Button>
                <Button variant="secondary" type="button" disabled={saveProfileMut.isPending} onClick={closeProfileEdit} className="w-full sm:w-auto">
                  Отмена
                </Button>
              </div>
            </Card>
          ) : null}
          {isMineRoute && mocks ? (
            <Card>
              <p className="text-sm text-stone-600">
                Демо-режим: данные профиля из моков. Чтобы править через API, отключите <code className="rounded bg-stone-100 px-1">VITE_USE_MOCKS</code> и укажите{' '}
                <code className="rounded bg-stone-100 px-1">VITE_API_URL</code>.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === 'pets' && showPets ? (
        <div className="space-y-4">
          {isMineRoute && !mocks ? (
            <Card className="space-y-3">
              <h3 className="font-semibold text-stone-900">Новый питомец</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="text-stone-600">Кличка *</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-stone-600">Вид / порода</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                    value={newPetSpecies}
                    onChange={(e) => setNewPetSpecies(e.target.value)}
                  />
                </label>
              </div>
              <Button
                variant="primary"
                type="button"
                disabled={createPetMut.isPending || !newPetName.trim()}
                onClick={() =>
                  createPetMut.mutate({
                    name: newPetName.trim(),
                    species: newPetSpecies.trim() || undefined,
                  })
                }
              >
                Добавить
              </Button>
            </Card>
          ) : null}
          {petsQuery.isPending ? <p className="text-stone-600">Загрузка карточек…</p> : null}
          {pets.length === 0 ? (
            <Card>
              <p className="text-stone-600">
                {isMineRoute ? 'Пока нет карточек питомцев — добавьте первую.' : 'Пока нет карточек питомцев.'}
              </p>
            </Card>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <PetCardBlock
                    pet={pet}
                    canManage={isMineRoute && !mocks}
                    mediaAuthFallback={!mocks}
                    editing={editingPetId === pet.id}
                    onToggleEdit={() => setEditingPetId((id) => (id === pet.id ? null : pet.id))}
                    onSave={(body) => updatePetMut.mutate({ id: pet.id, body })}
                    onDelete={() =>
                      showConfirm({
                        title: 'Удалить карточку питомца?',
                        message: 'Действие нельзя отменить.',
                        danger: true,
                        confirmLabel: 'Удалить',
                        onConfirm: () => deletePetMut.mutate(pet.id),
                      })
                    }
                    onUploadPhoto={(file) => uploadPetAvatarMut.mutate({ id: pet.id, file })}
                    onRemovePhoto={() =>
                      showConfirm({
                        title: 'Убрать фото питомца?',
                        message: 'Изображение будет удалено.',
                        danger: true,
                        confirmLabel: 'Убрать',
                        onConfirm: () => deletePetAvatarMut.mutate(pet.id),
                      })
                    }
                    busy={updatePetMut.isPending || deletePetMut.isPending || uploadPetAvatarMut.isPending || deletePetAvatarMut.isPending}
                  />
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

      {tab === 'listings' && isMineRoute ? (
        <div className="space-y-4">
          {mocks ? (
            <Card>
              <p className="text-sm text-stone-600">В демо-режиме список «мои объявления» с бэкенда недоступен.</p>
            </Card>
          ) : myListingsQuery.isPending ? (
            <p className="text-stone-600">Загрузка объявлений…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  type="button"
                  disabled={createListingMut.isPending}
                  onClick={() =>
                    createListingMut.mutate({
                      kind: 'OFFER_SITTER',
                      title: 'Новое объявление',
                      description: '',
                      city: '',
                      pricePerDay: 0,
                      periodText: '—',
                    })
                  }
                >
                  Черновик: возьму на передержку
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  disabled={createListingMut.isPending}
                  onClick={() =>
                    createListingMut.mutate({
                      kind: 'NEED_SITTER',
                      title: 'Новое объявление',
                      description: '',
                      city: '',
                      pricePerDay: 0,
                      periodText: '—',
                    })
                  }
                >
                  Черновик: ищу передержку
                </Button>
              </div>
              <ul className="space-y-3">
                {(myListingsQuery.data ?? []).length === 0 ? (
                  <Card>
                    <p className="text-stone-600">У вас пока нет объявлений.</p>
                  </Card>
                ) : (
                  (myListingsQuery.data ?? []).map((listing) => (
                    <li key={listing.id}>
                      <MyListingRow
                        listing={listing}
                        onPublish={() => publishListingMut.mutate(listing.id)}
                        onDelete={() =>
                          showConfirm({
                            title: 'Удалить объявление?',
                            message: 'Объявление будет удалено без возможности восстановления.',
                            danger: true,
                            confirmLabel: 'Удалить',
                            onConfirm: () => deleteListingMut.mutate(listing.id),
                          })
                        }
                        busy={publishListingMut.isPending || deleteListingMut.isPending}
                      />
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MyListingRow({
  listing,
  onPublish,
  onDelete,
  busy,
}: {
  listing: Listing;
  onPublish: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-stone-900">{listing.title}</p>
        <p className="text-xs text-stone-500">
          Статус: <strong>{listingStatusRu(listing.publishStatus)}</strong> · {listing.city || 'город не указан'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={ROUTES.listing(listing.id)}
          className="inline-flex min-h-[40px] items-center rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800 ring-1 ring-stone-200 hover:bg-stone-200"
        >
          Открыть
        </Link>
        {listing.publishStatus === 'DRAFT' ? (
          <Button variant="primary" type="button" disabled={busy} onClick={onPublish}>
            Опубликовать
          </Button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-red-700 underline decoration-red-200 hover:bg-red-50"
          onClick={onDelete}
        >
          Удалить
        </button>
      </div>
    </Card>
  );
}

function PetCardBlock({
  pet,
  canManage,
  mediaAuthFallback,
  editing,
  onToggleEdit,
  onSave,
  onDelete,
  onUploadPhoto,
  onRemovePhoto,
  busy,
}: {
  pet: PetCard;
  canManage: boolean;
  mediaAuthFallback: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onSave: (body: UpdatePetBody) => void;
  onDelete: () => void;
  onUploadPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState(pet.name);
  const [species, setSpecies] = useState(pet.species);
  const [description, setDescription] = useState(pet.description);
  const [habits, setHabits] = useState(pet.habits);
  const [vaccinations, setVaccinations] = useState(pet.vaccinations);
  const [allergies, setAllergies] = useState(pet.allergies);
  const [vetNotes, setVetNotes] = useState(() => pet.vetNotes ?? '');

  useEffect(() => {
    setName(pet.name);
    setSpecies(pet.species);
    setDescription(pet.description);
    setHabits(pet.habits);
    setVaccinations(pet.vaccinations);
    setAllergies(pet.allergies);
    setVetNotes(pet.vetNotes ?? '');
  }, [pet]);

  return (
    <Card className="h-full space-y-3">
      <div className="flex gap-3">
        <Avatar src={pet.avatarUrl} alt={pet.name} size="md" mediaAuthFallback={mediaAuthFallback} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-stone-900">{pet.name}</h3>
          <p className="text-sm text-stone-500">{pet.species}</p>
          {canManage ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="cursor-pointer text-xs font-semibold text-amber-800 underline">
                Фото
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) onUploadPhoto(f);
                  }}
                />
              </label>
              <button type="button" className="text-xs font-semibold text-stone-600 underline" onClick={onRemovePhoto}>
                Убрать фото
              </button>
              <button type="button" className="text-xs font-semibold text-stone-600 underline" onClick={onToggleEdit}>
                {editing ? 'Закрыть' : 'Править'}
              </button>
              <button type="button" className="text-xs font-semibold text-red-700 underline" onClick={onDelete}>
                Удалить
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {editing && canManage ? (
        <div className="space-y-2 border-t border-stone-100 pt-3 text-sm">
          <input className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Кличка" />
          <input className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Вид" />
          <textarea className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
          <textarea className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={habits} onChange={(e) => setHabits(e.target.value)} placeholder="Привычки" />
          <textarea className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={vaccinations} onChange={(e) => setVaccinations(e.target.value)} placeholder="Прививки" />
          <textarea className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Аллергии" />
          <textarea className="w-full rounded-lg border border-stone-200 px-2 py-1.5" value={vetNotes} onChange={(e) => setVetNotes(e.target.value)} placeholder="Ветзаметки" />
          <Button
            variant="primary"
            type="button"
            disabled={busy || !name.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                species: species.trim() || undefined,
                description: description.trim() || undefined,
                habits: habits.trim() || undefined,
                vaccinations: vaccinations.trim() || undefined,
                allergies: allergies.trim() || undefined,
                vetNotes: vetNotes.trim() || undefined,
              })
            }
          >
            Сохранить карточку
          </Button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </Card>
  );
}

/** `publicUrl` для `DELETE /me/profile/gallery`: как в ответе API, без `resolveMediaUrl`. */
function galleryDeletePublicUrl(profile: PublicProfile, index: number): string {
  const canonical = profile.galleryCanonicalUrls?.[index];
  if (typeof canonical === 'string' && canonical.length > 0) return canonical;
  const fallback = profile.galleryUrls[index];
  if (!fallback) throw new Error('Не найден элемент галереи');
  return fallback;
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
