import { getApiBaseUrl } from '@/api/client';

/** На HTTPS-странице браузер блокирует http://-картинки (mixed content); для API на localhost оставляем как есть. */
function upgradeHttpToHttpsIfPageIsHttps(url: string): string {
  if (!/^http:\/\//i.test(url)) return url;
  if (typeof globalThis === 'undefined' || !('location' in globalThis) || globalThis.location?.protocol !== 'https:') {
    return url;
  }
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return url;
    return `https://${url.slice(7)}`;
  } catch {
    return url;
  }
}

/**
 * Абсолютный URL медиафайла: внешние http(s) без изменений, относительные — с origin API.
 */
export function resolveMediaUrl(pathOrUrl: string | null | undefined, apiOrigin: string = getApiBaseUrl()): string {
  if (pathOrUrl == null || pathOrUrl === '') return '';
  const s = pathOrUrl.trim();
  let out: string;
  if (/^https?:\/\//i.test(s)) {
    out = s;
  } else if (s.startsWith('//')) {
    /* Ссылка вида //disk.yandex.ru/... — без схемы <img> и склейка с origin API дают неверный URL. */
    const proto =
      typeof globalThis !== 'undefined' && 'location' in globalThis && globalThis.location?.protocol
        ? globalThis.location.protocol
        : 'https:';
    out = `${proto}${s}`;
  } else if (s.startsWith('/')) {
    out = `${apiOrigin}${s}`;
  } else {
    out = `${apiOrigin}/${s}`;
  }
  return upgradeHttpToHttpsIfPageIsHttps(out);
}

/** Простой числовой хеш строки для cache-busting (детерминированный — одинаковый URL даёт одинаковый хеш). */
function urlVersionHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * URL аватара через прокси API (тот же origin, что и JSON) — надёжнее прямых ссылок на Яндекс.Диск из браузера.
 * @param rawUrl оригинальный URL из DTO (используется для cache-busting при замене аватара)
 */
export function userProfileAvatarProxyUrl(
  userId: string,
  apiOrigin: string = getApiBaseUrl(),
  rawUrl?: string,
): string {
  const b = apiOrigin.replace(/\/+$/, '');
  const base = `${b}/api/v1/users/${userId}/avatar`;
  if (rawUrl) return `${base}?v=${urlVersionHash(rawUrl)}`;
  return base;
}

/**
 * Снимок галереи по индексу (порядок как в `galleryUrls` ответа профиля).
 * @param rawUrl оригинальный URL из DTO (используется для cache-busting)
 */
export function userProfileGalleryProxyUrl(
  userId: string,
  index: number,
  apiOrigin: string = getApiBaseUrl(),
  rawUrl?: string,
): string {
  const b = apiOrigin.replace(/\/+$/, '');
  const base = `${b}/api/v1/users/${userId}/gallery/${index}`;
  if (rawUrl) return `${base}?v=${urlVersionHash(rawUrl)}`;
  return base;
}

/**
 * URL аватара питомца через прокси API (как у профиля человека).
 * @param rawUrl оригинальный URL из DTO (cache-busting при замене файла)
 */
export function petAvatarProxyUrl(
  petId: string,
  apiOrigin: string = getApiBaseUrl(),
  rawUrl?: string,
): string {
  const b = apiOrigin.replace(/\/+$/, '');
  const base = `${b}/api/v1/pets/${petId}/avatar`;
  if (rawUrl) return `${base}?v=${urlVersionHash(rawUrl)}`;
  return base;
}

/**
 * URL обложки объявления через прокси API.
 * @param rawUrl оригинальный URL из DTO (cache-busting при замене файла)
 */
export function listingCoverProxyUrl(
  listingId: string,
  apiOrigin: string = getApiBaseUrl(),
  rawUrl?: string,
): string {
  const b = apiOrigin.replace(/\/+$/, '');
  const base = `${b}/api/v1/listings/${listingId}/cover`;
  if (rawUrl) return `${base}?v=${urlVersionHash(rawUrl)}`;
  return base;
}
