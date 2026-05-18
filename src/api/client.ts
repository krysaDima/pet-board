/**
 * HTTP-клиент для работы с Java API.
 * Автоматически добавляет Bearer-токен и обрабатывает refresh.
 */

import type { ProblemDetail, RefreshRequest, AuthResponse, StoredSession } from './types';

const API_PREFIX = '/api/v1';
const SESSION_KEY = 'pet-board-session';
/** Сохранять сессию между перезапусками браузера (`localStorage`), иначе только до закрытия вкладки (`sessionStorage`). */
const SESSION_REMEMBER_KEY = 'pet-board-remember';

function getSessionPersistence(): boolean {
  try {
    const f = localStorage.getItem(SESSION_REMEMBER_KEY);
    if (f === '0') return false;
    if (f === '1') return true;
    if (localStorage.getItem(SESSION_KEY) && !sessionStorage.getItem(SESSION_KEY)) return true;
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    return true;
  } catch {
    return true;
  }
}

export function getApiBaseUrl(): string {
  /* Пустая строка в .env не подпадает под ?? — иначе origin медиа «прилипает» к фронту (5173) и картинки 404. */
  let raw = String(import.meta.env.VITE_API_URL ?? '').trim();
  raw = raw.replace(/\/+$/, '');
  /* Частая ошибка: в .env указали уже с префиксом /api/v1 — убираем, клиент дописывает сам. */
  if (/\/api\/v1$/i.test(raw)) {
    raw = raw.replace(/\/api\/v1$/i, '');
  }
  raw = raw.replace(/\/+$/, '');
  /*
   * На GitHub Pages нельзя ходить на localhost:8080 — это машина пользователя, не ваш ПК.
   * Прод-сборка обязана получить VITE_API_URL в CI (см. deploy-github-pages.yml).
   */
  if (!raw) {
    if (import.meta.env.DEV) {
      raw = 'http://localhost:8080';
    } else {
      console.error(
        '[pet-board] VITE_API_URL не задан при сборке: задайте URL публичного API в GitHub → Variables/Secrets.',
      );
    }
  }
  return raw;
}

/** Чтение сессии: сначала стойкий вход, затем сессия вкладки. */
export function getStoredSession(): StoredSession | null {
  try {
    const localRaw = localStorage.getItem(SESSION_KEY);
    if (localRaw) return JSON.parse(localRaw) as StoredSession;
    const tabRaw = sessionStorage.getItem(SESSION_KEY);
    if (tabRaw) return JSON.parse(tabRaw) as StoredSession;
    return null;
  } catch {
    return null;
  }
}

/**
 * Сохранение сессии.
 * @param persist — `true`: между сеансами браузера; `false`: до закрытия вкладки.
 */
export function saveSession(session: StoredSession, persist?: boolean): void {
  const p = persist === undefined ? getSessionPersistence() : persist;
  try {
    localStorage.setItem(SESSION_REMEMBER_KEY, p ? '1' : '0');
    const payload = JSON.stringify(session);
    if (p) {
      localStorage.setItem(SESSION_KEY, payload);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* приватный режим */
  }
}

/** Очистка сессии */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_REMEMBER_KEY);
  } catch {
    /* */
  }
}

/** Преобразование AuthResponse в StoredSession */
export function authResponseToSession(res: AuthResponse): StoredSession {
  const now = Date.now();
  return {
    userId: res.userId,
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    accessTokenExpiresAt: now + res.accessTokenExpiresIn,
    refreshTokenExpiresAt: now + res.refreshTokenExpiresIn,
  };
}

/** Проверка истечения access-токена (с запасом 30 сек) */
export function isAccessTokenExpired(session: StoredSession): boolean {
  return Date.now() > session.accessTokenExpiresAt - 30_000;
}

/** Проверка истечения refresh-токена */
export function isRefreshTokenExpired(session: StoredSession): boolean {
  return Date.now() > session.refreshTokenExpiresAt;
}

/** Класс ошибки API */
export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: ProblemDetail,
  ) {
    super(problem.detail || problem.title);
    this.name = 'ApiError';
  }
}

/** Обновление токена */
async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const body: RefreshRequest = { refreshToken };
  const res = await fetch(`${getApiBaseUrl()}${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const problem = (await res.json()) as ProblemDetail;
    throw new ApiError(res.status, problem);
  }

  return res.json() as Promise<AuthResponse>;
}

/** Получение актуального access-токена (с автообновлением) */
export async function getValidAccessToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) return null;

  if (isRefreshTokenExpired(session)) {
    clearSession();
    return null;
  }

  if (isAccessTokenExpired(session)) {
    try {
      const newAuth = await refreshAccessToken(session.refreshToken);
      const newSession = authResponseToSession(newAuth);
      saveSession(newSession);
      return newSession.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }

  return session.accessToken;
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
};

/**
 * Универсальный fetch к API.
 * @param path - путь после /api/v1 (например '/listings')
 * @param options - настройки запроса
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = await getValidAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${getApiBaseUrl()}${API_PREFIX}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let problem: ProblemDetail;
    try {
      problem = (await res.json()) as ProblemDetail;
    } catch {
      problem = {
        type: 'about:blank',
        title: 'Ошибка сервера',
        status: res.status,
        detail: `HTTP ${res.status}`,
        instance: path,
      };
    }
    throw new ApiError(res.status, problem);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** GET запрос (публичный, без авторизации) */
export function apiGet<T>(path: string, auth = true): Promise<T> {
  return apiFetch<T>(path, { method: 'GET', auth });
}

/** POST запрос */
export function apiPost<T>(path: string, body: unknown, auth = true): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body, auth });
}

/** PUT запрос */
export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PUT', body });
}

/** DELETE запрос (опциональное JSON-тело — например `DELETE /me/profile/gallery`). */
export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'DELETE',
    ...(body !== undefined ? { body } : {}),
  });
}

/**
 * POST multipart (без JSON Content-Type; boundary выставляет браузер).
 * Защищённые эндпоинты получают Bearer при наличии сессии.
 */
export async function apiPostMultipart<T>(path: string, formData: FormData, auth = true): Promise<T | undefined> {
  const headers: Record<string, string> = {};
  if (auth) {
    const token = await getValidAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${API_PREFIX}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const rawText = await res.text();

  if (!res.ok) {
    let problem: ProblemDetail;
    try {
      problem = rawText ? (JSON.parse(rawText) as ProblemDetail) : { type: 'about:blank', title: '', detail: '', instance: path, status: res.status };
    } catch {
      problem = {
        type: 'about:blank',
        title: 'Ошибка сервера',
        status: res.status,
        detail: rawText?.trim() ? rawText.trim().slice(0, 400) : `HTTP ${res.status}`,
        instance: path,
      };
    }
    if (!problem.detail && problem.title) problem = { ...problem, detail: problem.title };
    throw new ApiError(res.status, problem);
  }

  if (!rawText.trim()) return undefined;

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new ApiError(res.status, {
      type: 'about:blank',
      title: 'Некорректный ответ сервера',
      status: res.status,
      detail: `После загрузки файла ожидался JSON. Проверьте POST ${API_PREFIX}${path} и переменную VITE_API_URL (origin без /api/v1).`,
      instance: path,
    });
  }
}
