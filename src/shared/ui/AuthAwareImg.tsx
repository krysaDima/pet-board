import { useAuthAwareImg } from '@/shared/lib/useAuthAwareImg';

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
    return <div className={`bg-stone-200 ${className ?? ''}`} role="img" aria-label={alt || undefined} />;
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
