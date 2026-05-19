const preloaded = new Set<string>();

/** Подсказка браузеру заранее скачать картинку (аватар профиля на мобильном). */
export function preloadImage(url: string): void {
  const u = url.trim();
  if (!u || preloaded.has(u)) return;
  preloaded.add(u);
  const img = new Image();
  img.decoding = 'async';
  img.src = u;
}
