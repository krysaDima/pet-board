import { isUuidString } from '@/shared/lib/isUuid';
import type { ChatThread } from '@/entities/chat/model/types';

const DM_PREFIX = 'dm-';
const UUID_LEN = 36;

/**
 * Стабильный id личного чата между двумя пользователями (порядок id не важен).
 */
export function makeDmChatId(userIdA: string, userIdB: string): string {
  return `${DM_PREFIX}${[userIdA, userIdB].sort().join('-')}`;
}

/** Разбор id личного чата (два UUID через дефис). */
export function parseDmChatId(chatId: string): [string, string] | null {
  if (!chatId.startsWith(DM_PREFIX)) return null;
  const rest = chatId.slice(DM_PREFIX.length);
  if (rest.length !== UUID_LEN * 2 + 1) return null;
  const first = rest.slice(0, UUID_LEN);
  if (rest[UUID_LEN] !== '-') return null;
  const second = rest.slice(UUID_LEN + 1);
  if (!isUuidString(first) || !isUuidString(second)) return null;
  return [first, second];
}

/** Пустой диалог между двумя участниками. */
export function createDmThread(chatId: string, participantIds: [string, string]): ChatThread {
  return {
    id: chatId,
    participantIds: [...participantIds].sort(),
    messages: [],
    unreadCount: 0,
    lastActivityAt: new Date().toISOString(),
  };
}
