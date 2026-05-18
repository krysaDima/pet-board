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

/**
 * URL аватара через прокси API (тот же origin, что и JSON) — надёжнее прямых ссылок на Яндекс.Диск из браузера.
 */
export function userProfileAvatarProxyUrl(userId: string, apiOrigin: string = getApiBaseUrl()): string {
  const b = apiOrigin.replace(/\/+$/, '');
  return `${b}/api/v1/users/${userId}/avatar`;
}

/** Снимок галереи по индексу (порядок как в `galleryUrls` ответа профиля). */
export function userProfileGalleryProxyUrl(
  userId: string,
  index: number,
  apiOrigin: string = getApiBaseUrl(),
): string {
  const b = apiOrigin.replace(/\/+$/, '');
  return `${b}/api/v1/users/${userId}/gallery/${index}`;
}
