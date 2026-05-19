import { useAuthAwareImg } from '@/shared/lib/useAuthAwareImg';
import { PetPhotoFallbackIcon } from '@/shared/ui/PetPhotoFallbackIcon';

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  mediaAuthFallback?: boolean;
  draggable?: boolean;
};

/** Изображение по URL; при ошибке — повтор с Bearer (как у защищённых файлов профиля). */
export function AuthAwareImg({
  src,
  alt,
  className,
  loading = 'lazy',
  mediaAuthFallback = true,
  draggable,
}: Props) {
  const { displaySrc, onImgError } = useAuthAwareImg(src, { authFallback: mediaAuthFallback });
  if (!displaySrc.trim()) {
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
      {...(draggable !== undefined ? { draggable } : {})}
      onError={onImgError}
    />
  );
}
