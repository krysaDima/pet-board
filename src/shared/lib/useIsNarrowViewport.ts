import { useEffect, useState } from 'react';

const QUERY = '(max-width: 639px)';

/** Узкий экран (мобильный layout Tailwind sm-). */
export function useIsNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof globalThis !== 'undefined' && 'matchMedia' in globalThis
      ? globalThis.matchMedia(QUERY).matches
      : false,
  );

  useEffect(() => {
    const mq = globalThis.matchMedia(QUERY);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return narrow;
}
