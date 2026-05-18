import { useAuthAwareImg } from '@/shared/lib/useAuthAwareImg';

type Props = {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  /** Если true, при ошибке загрузки картинки пробуем скачать файл с Authorization (защищённые URL API). */
  mediaAuthFallback?: boolean;
  /** Дополнительные классы (например обводку снимают при обёртке с собственной рамкой). */
  className?: string;
};

const dims: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-base',
  lg: 'h-24 w-24 text-2xl',
};

/**
 * Превью аватара пользователя или питомца; при пустой ссылке — инициал из alt.
 */
export function Avatar({ src, alt, size = 'md', mediaAuthFallback = false, className = '' }: Props) {
  const { displaySrc, onImgError } = useAuthAwareImg(src, { authFallback: mediaAuthFallback });
  const url = displaySrc.trim();
  const cls = dims[size];
  const extra = className ? ` ${className}` : '';

  if (!url) {
    const letter = (alt.trim().charAt(0) || '?').toUpperCase();
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-stone-200 font-bold text-stone-600 shadow-md ring-2 ring-white ${cls}${extra}`}
        aria-hidden={!alt.trim()}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={`shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white ${cls.split(' ').slice(0, 2).join(' ')}${extra}`}
      loading="lazy"
      onError={onImgError}
    />
  );
}
