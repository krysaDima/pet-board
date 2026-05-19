import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';

const LOGO_SRC = '/images/logo-happy-dog.png';

/**
 * Логотип «Счастливый пёсик»: круглая иконка собаки, название и мягкая CSS-анимация.
 */
export function SiteLogo({ className = '' }: { className?: string }) {
  return (
    <Link
      to={ROUTES.home}
      className={`site-logo group flex touch-manipulation items-center gap-3 sm:gap-3.5 ${className}`}
      aria-label="На главную — Счастливый пёсик"
    >
      <span className="site-logo__mark" aria-hidden>
        <span className="site-logo__mark-glow" />
        <img src={LOGO_SRC} alt="" className="site-logo__img" width={60} height={60} decoding="async" />
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="site-logo__title">
          <span className="site-logo__title-accent">Счастливый</span>
          <span className="site-logo__title-main"> пёсик</span>
        </span>
        <span className="site-logo__tagline">Зооуслуги и помощь</span>
      </span>
    </Link>
  );
}
