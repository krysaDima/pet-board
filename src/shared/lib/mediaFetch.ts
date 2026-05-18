import { getApiBaseUrl, getValidAccessToken } from '@/api/client';

/** Запрос с Authorization имеет смысл только к нашему API; на Яндекс.Диск и т.д. заголовок даёт CORS-preflight и обычно падает. */
function isMediaOnOurApi(absoluteUrl: string): boolean {
  const base = getApiBaseUrl().trim();
  if (!base) return false;
  try {
    const u = new URL(absoluteUrl);
    const b = new URL(base.endsWith('/') ? base : `${base}/`);
    return u.origin === b.origin;
  } catch {
    return false;
  }
}

/**
 * Загружает бинарь для <img>: для URL на origin API при необходимости добавляет Bearer.
 * Для внешних URL — обычный GET (как у публичной ссылки Диска).
 * Убедитесь, что CORS на бэкенде разрешает origin фронта и заголовок Authorization для защищённых файлов.
 */
export async function fetchMediaBlobUrl(absoluteUrl: string): Promise<string | null> {
  if (!absoluteUrl.trim()) return null;
  const token = await getValidAccessToken();
  const headers: Record<string, string> = {};
  if (token && isMediaOnOurApi(absoluteUrl)) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(absoluteUrl, { headers });
  if (!res.ok) return null;
  const blob = await res.blob();
  if (!blob.size) return null;
  return URL.createObjectURL(blob);
}
