import type { ChatThread } from '@/entities/chat/model/types';
import type { Message } from '@/entities/chat/model/types';

/** Один диалог на собеседника; при дублях объединяются превью и счётчик непрочитанных. */
export function dedupeChatThreadsByOtherUser(threads: ChatThread[], currentUserId: string): ChatThread[] {
  const byOther = new Map<string, ChatThread>();

  for (const thread of threads) {
    const otherId = thread.participantIds.find((id) => id !== currentUserId);
    if (!otherId) continue;

    const prev = byOther.get(otherId);
    if (!prev) {
      byOther.set(otherId, thread);
      continue;
    }

    const keep = threadActivityTime(thread) >= threadActivityTime(prev) ? thread : prev;
    const drop = keep === thread ? prev : thread;
    byOther.set(otherId, {
      ...keep,
      unreadCount: (keep.unreadCount ?? 0) + (drop.unreadCount ?? 0),
      listingId: keep.listingId ?? drop.listingId,
      messages: mergeMessages(keep.messages, drop.messages),
    });
  }

  return Array.from(byOther.values());
}

function mergeMessages(a: Message[], b: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of [...a, ...b]) {
    byId.set(m.id, m);
  }
  return [...byId.values()].sort((x, y) => x.sentAt.localeCompare(y.sentAt));
}

function threadActivityTime(thread: ChatThread): string {
  return thread.lastActivityAt ?? thread.messages[thread.messages.length - 1]?.sentAt ?? '';
}
