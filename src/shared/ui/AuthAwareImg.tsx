import { useAuthAwareImg } from '@/shared/lib/useAuthAwareImg';
import { PetPhotoFallbackIcon } from '@/shared/ui/PetPhotoFallbackIcon';

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** false — плейсхолдер до появления в viewport (галерея на мобильном). */
  loadWhen?: boolean;
  mediaAuthFallback?: boolean;
  draggable?: boolean;
};

/** Изображение по URL; при ошибке — повтор с Bearer (как у защищённых файлов профиля). */
export function AuthAwareImg({
  src,
  alt,
  className,
  loading = 'lazy',
  fetchPriority,
  loadWhen = true,
  mediaAuthFallback = true,
  draggable,
}: Props) {
  const effectiveSrc = loadWhen ? src : '';
  const { displaySrc, onImgError } = useAuthAwareImg(effectiveSrc, { authFallback: mediaAuthFallback });
  if (!loadWhen || !displaySrc.trim()) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/50 to-orange-50/80 text-stone-400 ${className ?? ''}`}
        role="img"
        aria-label={alt || undefined}
      >
        <PetPhotoFallbackIcon className="h-[32%] w-[32%] min-h-[2.25rem] min-w-[2.25rem] max-h-24 max-w-24 shrink-0" />
      </div>
    );
  }
  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      sizes="(max-width: 639px) 100vw, 18rem"
      {...(draggable !== undefined ? { draggable } : {})}
      onError={onImgError}
    />
  );
}
