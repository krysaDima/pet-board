/**
 * Устойчивый к коллизиям идентификатор для клиентских сущностей (сообщения, временные ключи).
 * В старых средах без crypto.randomUUID используется запасной вариант.
 */
export function generateUniqueId(prefix = 'id'): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    /* игнорируем — ниже fallback */
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
