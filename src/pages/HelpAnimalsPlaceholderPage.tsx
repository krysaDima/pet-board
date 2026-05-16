import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';

/** Широкий кадр только для страницы раздела (на главной карточке — отдельный вертикальный `help-animals-hero.png`). */
const HERO_PAGE_IMG = '/images/help-animals-page-hero.png';

/** Заглушка раздела «Помощь животным» — позже сюда вынесем отдельный функционал. */
export function HelpAnimalsPlaceholderPage() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.help-hero', { opacity: 0, y: 20, duration: 0.55, ease: 'power3.out' });
      gsap.from('.help-card', {
        opacity: 0,
        y: 16,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.12,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <article ref={rootRef} className="mx-auto max-w-3xl space-y-6 sm:space-y-10">
      <div className="help-hero relative w-full overflow-hidden rounded-2xl shadow-2xl shadow-stone-900/20 ring-1 ring-stone-200/80 sm:rounded-3xl">
        <img
          src={HERO_PAGE_IMG}
          alt="Кормление бездомных собак и кошек во дворе, надпись помощи животным на стене"
          className="block w-full aspect-[16/9] object-cover object-[24%_54%] sm:aspect-[2/1] sm:object-[22%_52%]"
          loading="eager"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/92 via-stone-900/45 via-amber-950/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-200/95 sm:text-[10px] sm:tracking-[0.35em]">
            Раздел в разработке
          </p>
          <h1 className="sr-only">Помощь животным</h1>
          <p className="mt-3 max-w-lg text-sm leading-snug text-stone-100 sm:mt-4 sm:text-base">
            Здесь появятся сборы на лечение и корм, волонтёрские заявки и партнёрские приюты. Пока — демо-заглушка.
          </p>
        </div>
      </div>

      <div className="help-card rounded-2xl border border-stone-200/80 bg-white/95 p-4 shadow-md ring-1 ring-stone-100/80 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-stone-900 sm:text-xl">Что планируем</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 pl-0.5 text-sm text-stone-600 marker:text-amber-600 sm:mt-4">
          <li>Карточки сборов на лечение и корм</li>
          <li>Заявки волонтёров и проверенные фонды</li>
          <li>Интеграция с вашим будущим Java-бэкендом</li>
        </ul>
      </div>

      <div className="help-card flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        <Link
          to={ROUTES.home}
          className="inline-flex min-h-[48px] flex-1 touch-manipulation items-center justify-center rounded-xl bg-stone-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition active:bg-stone-800 sm:flex-none sm:min-w-[11rem]"
        >
          ← На главную
        </Link>
        <Link
          to={ROUTES.board}
          className="inline-flex min-h-[48px] flex-1 touch-manipulation items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-center text-sm font-semibold text-stone-800 transition active:bg-amber-50 sm:flex-none sm:min-w-[11rem] md:hover:border-amber-300 md:hover:bg-amber-50/50"
        >
          К доске передержки
        </Link>
      </div>
    </article>
  );
}
