/** Круглая «медалька» с лапкой для карточек услуг. */
export function PawBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-warm-700 text-cream-50 shadow-sm ring-2 ring-white ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <ellipse cx="12" cy="16" rx="5" ry="4" />
        <circle cx="6" cy="10" r="2.2" />
        <circle cx="12" cy="8" r="2.2" />
        <circle cx="18" cy="10" r="2.2" />
      </svg>
    </span>
  );
}
