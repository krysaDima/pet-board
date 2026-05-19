import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { PawBadge } from '@/shared/ui/PawBadge';

const HERO_IMG = '/images/hero-home.png';

const SERVICES = [
  {
    to: ROUTES.board,
    title: 'Передержка',
    desc: 'Надёжный дом на время отъезда: ситтеры и владельцы находят друг друга на доске объявлений.',
    img: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=85',
    ready: true,
  },
  {
    to: ROUTES.helpAnimals,
    title: 'Помощь животным',
    desc: 'Поддержка приютов, волонтёров и питомцев, которым нужна забота. Раздел скоро расширится.',
    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=85',
    ready: false,
  },
  {
    to: ROUTES.petServices,
    title: 'Услуги для питомцев',
    desc: 'Груминг, выгул, ветконсультации и другие услуги — подключим в той же стилистике.',
    img: 'https://images.unsplash.com/photo-1516734212184-9671993a8b7c?auto=format&fit=crop&w=800&q=85',
    ready: false,
  },
] as const;

/**
 * Главная в стиле лендинга: hero с фото, слоган и три карточки услуг.
 */
export function MainHubPage() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.landing-hero', { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out' });
      gsap.from('.landing-service-card', {
        opacity: 0,
        y: 32,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.25,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative -mx-4 px-4 sm:-mx-0 sm:px-0">
      <span
        className="landing-blob -left-16 top-8 h-40 w-40 bg-sage-200/40 sm:h-56 sm:w-56"
        aria-hidden
      />
      <span
        className="landing-blob -right-12 top-32 h-32 w-32 rounded-[40%] bg-cream-200/80 sm:h-48 sm:w-48"
        aria-hidden
      />

      <div className="landing-hero relative overflow-hidden rounded-[2rem] shadow-2xl shadow-warm-900/15 ring-1 ring-white/60 sm:rounded-[2.5rem]">
        <div className="relative grid min-h-[min(420px,72dvh)] sm:min-h-[min(520px,85vh)] lg:grid-cols-[1.15fr_1fr]">
          <HeroPhoto />
          <HeroCopy />
        </div>
      </div>

      <ul className="relative z-10 -mt-6 grid gap-5 sm:-mt-14 sm:grid-cols-3 sm:gap-6 lg:-mt-20">
        {SERVICES.map((s) => (
          <li key={s.to}>
            <Link
              to={s.to}
              className="landing-service-card group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-warm-900/10 ring-1 ring-cream-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sage-900/10"
            >
              <div className="relative h-36 overflow-hidden bg-cream-100 sm:h-40">
                <img
                  src={s.img}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <ServiceCardBody title={s.title} desc={s.desc} ready={s.ready} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HeroPhoto() {
  return (
    <div className="relative min-h-[240px] lg:min-h-0">
      <img
        src={HERO_IMG}
        alt="Собака и кошки в уютной гостиной"
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-sage-900/50 via-transparent to-transparent lg:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-sage-900/25 lg:block" />
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="relative flex flex-col justify-center bg-gradient-to-br from-sage-800/95 via-sage-700/92 to-sage-900/95 px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-sage-200/90 sm:text-xs">Счастливый пёсик</p>
      <h1 className="mt-3 font-sans text-3xl font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
        <span className="text-white">Дарим счастье</span>
        <br />
        <span className="text-sage-200">вашему хвостику</span>
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-sage-100/95 sm:text-base">
        Профессиональная передержка, забота о питомцах и полезные сервисы — всё в одном месте. Найдите ситтера или
        разместите объявление после входа.
      </p>
      <Link
        to={ROUTES.board}
        className="mt-8 inline-flex min-h-[48px] w-fit items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold uppercase tracking-wider text-sage-800 shadow-lg transition hover:bg-sage-50 active:scale-[0.98]"
      >
        Выбрать услугу
      </Link>
    </div>
  );
}

function ServiceCardBody({ title, desc, ready }: { title: string; desc: string; ready: boolean }) {
  return (
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="-mt-8 flex items-start justify-between gap-2">
        <PawBadge className="shadow-md" />
        {!ready ? (
          <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-700">
            Скоро
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-sans text-lg font-extrabold uppercase tracking-wide text-warm-900 sm:text-xl">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-warm-600/90">{desc}</p>
      <span className="mt-4 text-sm font-bold text-sage-600 transition group-hover:text-sage-700">
        Подробнее <span aria-hidden>›</span>
      </span>
    </div>
  );
}
