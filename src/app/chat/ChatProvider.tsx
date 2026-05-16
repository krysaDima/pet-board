import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ChatThread, Message } from '@/entities/chat/model/types';
import { makeDmChatId } from '@/entities/chat/lib/makeDmChatId';
import { MOCK_CURRENT_USER_ID, mockInitialChats } from '@/api/mocks/data';
import { generateUniqueId } from '@/shared/lib/generateId';

type ChatContextValue = {
  threads: ChatThread[];
  ensureThreadWith: (otherUserId: string) => string;
  sendMessage: (chatId: string, body: string) => void;
  getThread: (chatId: string) => ChatThread | undefined;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/** Провайдер in-memory чатов (MVP); позже транспорт заменится на API/WebSocket. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>(() =>
    mockInitialChats.map((t) => ({ ...t, messages: [...t.messages] })),
  );

  const ensureThreadWith = useCallback((otherUserId: string) => {
    const me = MOCK_CURRENT_USER_ID;
    const id = makeDmChatId(me, otherUserId);
    setThreads((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, participantIds: [me, otherUserId].sort(), messages: [] }];
    });
    return id;
  }, []);

  const sendMessage = useCallback((chatId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const msg: Message = {
      id: generateUniqueId('m'),
      senderId: MOCK_CURRENT_USER_ID,
      body: trimmed,
      sentAt: new Date().toISOString(),
    };
    setThreads((prev) => prev.map((t) => (t.id === chatId ? { ...t, messages: [...t.messages, msg] } : t)));
  }, []);

  const getThread = useCallback((chatId: string) => threads.find((t) => t.id === chatId), [threads]);

  const value = useMemo(
    () => ({ threads, ensureThreadWith, sendMessage, getThread }),
    [threads, ensureThreadWith, sendMessage, getThread],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStore() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatStore должен вызываться внутри ChatProvider');
  return ctx;
}
