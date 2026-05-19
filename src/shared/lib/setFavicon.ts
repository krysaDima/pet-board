import faviconPng from '@/assets/favicon.png';

/** Подключает favicon с учётом `base` Vite (localhost и GitHub Pages). */
export function setFavicon(): void {
  const href = faviconPng;
  const defs: Array<{ rel: string; sizes?: string }> = [
    { rel: 'icon', sizes: 'any' },
    { rel: 'shortcut icon' },
    { rel: 'apple-touch-icon' },
  ];

  for (const { rel, sizes } of defs) {
    const selector = sizes
      ? `link[rel="${rel}"][sizes="${sizes}"]`
      : `link[rel="${rel}"]`;
    let link = document.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (sizes) link.sizes = sizes;
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = href;
  }
}
