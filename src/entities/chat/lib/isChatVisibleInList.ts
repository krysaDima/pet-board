import type { ChatThread } from '@/entities/chat/model/types';

/** Показывать в списке чатов только диалоги с сообщениями после очистки. */
export function isChatVisibleInList(thread: ChatThread): boolean {
  if (thread.hiddenFromList) return false;
  return thread.messages.length > 0;
}
