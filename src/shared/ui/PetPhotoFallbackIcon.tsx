/** Мягкая иллюстрация-затычка для фото животных / объявлений без картинки (не значок «сломанный файл» браузера). */
export function PetPhotoFallbackIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="39" cy="48" rx="22" ry="18" stroke="currentColor" strokeWidth="2" opacity={0.45} />
      <circle cx="22" cy="28" r="8" stroke="currentColor" strokeWidth="2" opacity={0.4} />
      <circle cx="39" cy="22" r="8" stroke="currentColor" strokeWidth="2" opacity={0.4} />
      <circle cx="56" cy="28" r="8" stroke="currentColor" strokeWidth="2" opacity={0.4} />
      <ellipse cx="30" cy="38" rx="6" ry="7" stroke="currentColor" strokeWidth="2" opacity={0.38} />
      <ellipse cx="48" cy="38" rx="6" ry="7" stroke="currentColor" strokeWidth="2" opacity={0.38} />
    </svg>
  );
}
