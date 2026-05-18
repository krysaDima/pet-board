import { ApiError } from '@/api/client';

/** Читаемое сообщение для UI (детали ProblemDetail, статус HTTP, traceId). */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const { status, problem: p } = error;
    const detail = p.detail?.trim() || p.title?.trim() || `Ответ сервера ${status}`;
    const trace = p.traceId ? ` · traceId: ${p.traceId}` : '';
    return `${detail} (HTTP ${status})${trace}`;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Произошла ошибка при обращении к серверу.';
}
