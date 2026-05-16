import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';

/** Фоновые кадры для главного выбора раздела (Unsplash). */
const IMG_BOARD = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=2000&q=88';
/** Локальный кадр «Помощь животным» (вертикальное фото, full-bleed на карточке как у «Передержки»). */
const IMG_HELP = '/images/help-animals-hero.png';
/** Локальный кадр «Услуги для животных» на главной (вертикальное фото, full-bleed как у соседних карточек). */
const IMG_SERVICES = '/images/pet-services-hero.png';

/**
 * Главная: крупные блоки с фото и «Перейти».
 * Всплывающие декоративные элементы при hover на карточках не используются — только фон и лёгкий CSS scale.
 */
export function MainHubPage() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 767px)').matches;

    const ctx = gsap.context(() => {
      if (reduce) return;
      const y = mobile ? 20 : 48;
      const dur = mobile ? 0.5 : 0.75;
      gsap.from('.hub-eyebrow', {
        opacity: 0,
        y: mobile ? 8 : 12,
        duration: 0.4,
        ease: 'power2.out',
      });
      gsap.from('.hub-panel', {
        opacity: 0,
        y,
        duration: dur,
        stagger: mobile ? 0.06 : 0.1,
        ease: 'power3.out',
        delay: 0.06,
      });
      gsap.from('.hub-panel-cta', {
        opacity: 0,
        x: mobile ? 0 : -12,
        duration: 0.35,
        stagger: 0.08,
        ease: 'power2.out',
        delay: mobile ? 0.22 : 0.4,
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="mx-auto max-w-6xl space-y-6 pb-2 sm:space-y-8 sm:pb-4">
      <header className="hub-eyebrow text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-800/90 sm:text-[11px] sm:tracking-[0.38em]">
          Добро пожаловать
        </p>
        <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] text-stone-900 sm:mt-3 sm:text-5xl sm:leading-tight">
          Забота о питомцах
        </h1>
        <p className="mx-auto mt-2 max-w-2xl px-1 text-sm leading-relaxed text-stone-600 sm:mt-3 sm:px-0 sm:text-base">
          Выберите раздел — доска передержки, помощь животным или услуги. Гостям доступен просмотр; чаты и переписка —
          после авторизации.
        </p>
      </header>

      <div className="grid min-h-0 gap-3 sm:gap-5 md:min-h-[min(72vh,560px)] md:grid-cols-3">
        <Link
          to={ROUTES.board}
          className="hub-panel group relative flex min-h-[200px] touch-manipulation rounded-2xl shadow-xl shadow-stone-900/15 ring-1 ring-white/10 active:scale-[0.99] max-md:min-h-[38vh] sm:min-h-[260px] sm:rounded-3xl md:min-h-0 md:active:scale-100"
        >
          <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl sm:rounded-3xl">
            <img
              src={IMG_BOARD}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
              loading="eager"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/92 via-stone-900/55 to-stone-900/25 transition-opacity duration-500 group-hover:from-stone-950/95" />
          </div>

          <div className="relative z-10 mt-auto flex flex-col p-5 sm:p-7">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/95 sm:text-[11px] sm:tracking-[0.28em]">
              Доска объявлений
            </span>
            <h2 className="mt-1.5 font-display text-[1.5rem] font-semibold tracking-wide text-white sm:mt-2 sm:text-3xl md:text-[2.1rem]">
              Передержка
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-200/95 sm:mt-3 sm:text-[15px]">
              Найдите исполнителя или разместите запрос после входа.
            </p>
            <span className="hub-panel-cta mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-200 sm:mt-5">
              Перейти <span aria-hidden>»</span>
            </span>
          </div>
        </Link>

        <Link
          to={ROUTES.helpAnimals}
          className="hub-panel group relative flex min-h-[200px] touch-manipulation rounded-2xl shadow-xl shadow-stone-900/15 ring-1 ring-white/10 active:scale-[0.99] max-md:min-h-[38vh] sm:min-h-[260px] sm:rounded-3xl md:min-h-0 md:active:scale-100"
        >
          <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl sm:rounded-3xl">
            <img
              src={IMG_HELP}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[48%_center] transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
              loading="eager"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/92 via-stone-900/55 to-stone-900/25 transition-opacity duration-500 group-hover:from-stone-950/95" />
          </div>

          <div className="relative z-10 mt-auto flex flex-col p-5 sm:p-7">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/95 sm:text-[11px] sm:tracking-[0.28em]">
              Скоро
            </span>
            <h2 className="mt-1.5 font-display text-[1.5rem] font-semibold tracking-wide text-white sm:mt-2 sm:text-3xl md:text-[2.1rem]">
              Помощь животным
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-200/95 sm:mt-3 sm:text-[15px]">
              Бездомным и обиженным питомцам нужна забота. Здесь появятся сборы, волонтёры и приюты — пока заглушка.
            </p>
            <span className="hub-panel-cta mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-200 sm:mt-5">
              Перейти <span aria-hidden>»</span>
            </span>
          </div>
        </Link>

        <Link
          to={ROUTES.petServices}
          className="hub-panel group relative flex min-h-[200px] touch-manipulation rounded-2xl shadow-xl shadow-stone-900/15 ring-1 ring-white/10 active:scale-[0.99] max-md:min-h-[38vh] sm:min-h-[260px] sm:rounded-3xl md:min-h-0 md:active:scale-100"
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
            <img
              src={IMG_SERVICES}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[48%_center] transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
              loading="eager"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-indigo-950/92 via-violet-900/45 to-stone-900/20 transition-opacity duration-500 group-hover:from-indigo-950/96" />
          </div>

          <div className="relative z-10 mt-auto flex flex-col p-5 sm:p-7">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-100/95 sm:text-[11px] sm:tracking-[0.28em]">
              Скоро
            </span>
            <h2 className="mt-1.5 font-display text-[1.5rem] font-semibold tracking-wide text-white sm:mt-2 sm:text-3xl md:text-[2.1rem]">
              Услуги для животных
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-200/95 sm:mt-3 sm:text-[15px]">
              Груминг, выгул, ветконсультации, зоотакси — раздел в той же стилистике, подключим позже.
            </p>
            <span className="hub-panel-cta mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold uppercase tracking-widest text-violet-100 sm:mt-5">
              Перейти <span aria-hidden>»</span>
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
