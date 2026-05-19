import { useEffect, useRef, useState, type RefObject } from 'react';

type Options = {
  /** Если false — грузим сразу (десктоп или первый кадр). */
  enabled: boolean;
  /** Для горизонтальной галереи — root = контейнер со скроллом. */
  rootRef?: RefObject<Element | null>;
  rootMargin?: string;
};

/**
 * Откладывает загрузку <img>, пока плитка не попала в видимую область (экономия LTE в ленте галереи).
 */
export function useDeferImageUntilVisible({
  enabled,
  rootRef,
  rootMargin = '80px',
}: Options): { ref: RefObject<HTMLDivElement | null>; shouldLoad: boolean } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setShouldLoad(true);
      return;
    }
    setShouldLoad(false);
    const el = ref.current;
    if (!el) return;

    const root = rootRef?.current ?? null;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          obs.disconnect();
        }
      },
      { root, rootMargin, threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, rootRef, rootMargin]);

  return { ref, shouldLoad };
}
