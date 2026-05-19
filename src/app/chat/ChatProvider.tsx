import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ChatThread, Message, MessageStatus } from '@/entities/chat/model/types';
import { dedupeChatThreadsByOtherUser } from '@/entities/chat/lib/dedupeChatThreads';
import { isChatVisibleInList } from '@/entities/chat/lib/isChatVisibleInList';
import { notifyIncomingChatMessage } from '@/features/chat/lib/notifyIncomingChatMessage';
import { bindChatAudioWarmup } from '@/features/chat/lib/playChatMessageSound';
import { createDmThread, makeDmChatId, parseDmChatId } from '@/entities/chat/lib/makeDmChatId';
import { useAuth } from '@/app/auth/AuthContext';
import { generateUniqueId } from '@/shared/lib/generateId';
import { sanitizeMessage } from '@/shared/lib/sanitize';
import {
  createOrGetChat,
  fetchChatById,
  fetchChatMessages,
  fetchMyChats,
  isChatApiEnabled,
  mapMessageDto,
  mapSummaryToThread,
  markChatRead,
  clearChatHistory,
  postChatMessage,
  type ChatSummaryDto,
  type MessageDto,
} from '@/api/chatApi';
import { ChatSocketClient } from '@/api/chatWebSocket';
import { isUuidString } from '@/shared/lib/isUuid';

const CHAT_STORAGE_PREFIX = 'pet-board-chat-threads:';

function loadStoredThreads(userId: string): ChatThread[] {
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return parsed.filter((t) => t.participantIds.includes(userId));
  } catch {
    return [];
  }
}

function persistThreads(userId: string, threads: ChatThread[]) {
  localStorage.setItem(`${CHAT_STORAGE_PREFIX}${userId}`, JSON.stringify(threads));
}

function mergeThreadLists(stored: ChatThread[], inMemory: ChatThread[]): ChatThread[] {
  if (inMemory.length === 0) return stored;
  const byId = new Map(stored.map((t) => [t.id, t]));
  for (const t of inMemory) {
    const existing = byId.get(t.id);
    if (!existing || t.messages.length >= existing.messages.length) {
      byId.set(t.id, t);
    }
  }
  return Array.from(byId.values());
}

type ChatContextValue = {
  threads: ChatThread[];
  isLoading: boolean;
  ensureThreadWith: (otherUserId: string, listingId?: string) => Promise<string>;
  ensureThreadFromChatId: (chatId: string) => Promise<boolean>;
  loadThreadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, body: string, replyToId?: string) => Promise<void>;
  editMessage: (chatId: string, messageId: string, newBody: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  markAsRead: (chatId: string) => Promise<void>;
  clearChat: (chatId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
  getThread: (chatId: string) => ChatThread | undefined;
  getTotalUnread: () => number;
  setTyping: (chatId: string, isTyping: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/** Провайдер чатов: API + WebSocket или локальные моки. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const userIdRef = useRef(userId);
  const threadsRef = useRef(threads);
  const socketRef = useRef<ChatSocketClient | null>(null);
  const useApi = isChatApiEnabled();

  userIdRef.current = userId;
  threadsRef.current = threads;

  const subscribeAllThreads = useCallback(() => {
    threadsRef.current.forEach((t) => socketRef.current?.subscribeChat(t.id));
  }, []);

  const normalizeThreads = useCallback(
    (list: ChatThread[]): ChatThread[] => {
      const uid = userIdRef.current;
      if (!uid || !useApi) return list;
      return dedupeChatThreadsByOtherUser(list, uid);
    },
    [useApi],
  );

  const updateThreads = useCallback(
    (updater: (prev: ChatThread[]) => ChatThread[]) => {
      setThreads((prev) => {
        const next = normalizeThreads(updater(prev));
        const uid = userIdRef.current;
        if (uid && !useApi) persistThreads(uid, next);
        return next;
      });
    },
    [useApi, normalizeThreads],
  );

  const upsertSummary = useCallback(
    (summary: ChatSummaryDto) => {
      if (!userId) return;
      const mapped = mapSummaryToThread(summary, userId);
      updateThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === mapped.id);
        if (idx === -1) return [...prev, mapped];
        const existing = prev[idx];
        const messages =
          existing.messages.length > mapped.messages.length ? existing.messages : mapped.messages;
        return prev.map((t, i) =>
          i === idx
            ? {
                ...mapped,
                messages,
                unreadCount: summary.unreadCount,
                listingId: summary.listingId ?? existing.listingId,
              }
            : t,
        );
      });
      socketRef.current?.subscribeChat(summary.id);
    },
    [userId, updateThreads],
  );

  const appendIncomingMessage = useCallback(
    (chatId: string, dto: MessageDto) => {
      if (!userId) return;
      const incoming = mapMessageDto(dto, userId);
      updateThreads((prev) =>
        prev.map((t) => {
          if (t.id !== chatId) return t;
          if (t.messages.some((m) => m.id === incoming.id)) return t;

          let messages = t.messages;
          if (incoming.senderId === userId) {
            const withoutOptimistic = messages.filter(
              (m) => !(m.senderId === userId && m.status === 'sending'),
            );
            messages = [...withoutOptimistic, incoming];
          } else {
            messages = [...messages, incoming];
          }

          const isOther = incoming.senderId !== userId;
          return {
            ...t,
            messages,
            hiddenFromList: false,
            lastActivityAt: incoming.sentAt,
            unreadCount: isOther ? (t.unreadCount ?? 0) + 1 : t.unreadCount,
          };
        }),
      );
    },
    [userId, updateThreads],
  );

  useEffect(() => {
    if (!userId) {
      setThreads([]);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    bindChatAudioWarmup();

    if (useApi) {
      setIsLoading(true);
      void fetchMyChats()
        .then((list) => {
          const mapped = list.map((s) => mapSummaryToThread(s, userId));
          setThreads(dedupeChatThreadsByOtherUser(mapped, userId));
        })
        .catch(() => setThreads([]))
        .finally(() => setIsLoading(false));

      const socket = new ChatSocketClient({
        onMessage: (chatId, msg) => {
          const uid = userIdRef.current;
          if (uid && msg.senderId !== uid) {
            notifyIncomingChatMessage({ chatId, message: msg });
          }
          if (!threadsRef.current.some((t) => t.id === chatId)) {
            void fetchChatById(chatId)
              .then((summary) => {
                upsertSummary(summary);
                appendIncomingMessage(chatId, msg);
              })
              .catch(() => appendIncomingMessage(chatId, msg));
            return;
          }
          appendIncomingMessage(chatId, msg);
        },
        onRead: (event) => {
          if (!userId) return;
          const readerIsMe = event.readByUserId === userId;
          updateThreads((prev) =>
            prev.map((t) => {
              if (t.id !== event.chatId) return t;
              return {
                ...t,
                unreadCount: readerIsMe ? 0 : t.unreadCount,
                messages: readerIsMe
                  ? t.messages
                  : t.messages.map((m) =>
                      m.senderId === userId ? { ...m, status: 'read' as MessageStatus } : m,
                    ),
              };
            }),
          );
        },
        onConnected: subscribeAllThreads,
      });
      socketRef.current = socket;
      void socket.connect();

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }

    const stored = loadStoredThreads(userId);
    setThreads((prev) => mergeThreadLists(stored, prev));
  }, [userId, useApi, appendIncomingMessage, updateThreads, subscribeAllThreads, upsertSummary]);

  useEffect(() => {
    if (!useApi || !socketRef.current?.client?.connected) return;
    subscribeAllThreads();
  }, [threads, useApi, subscribeAllThreads]);

  useEffect(() => {
    if (!userId || useApi) return;
    const interval = setInterval(() => {
      updateThreads((prev) =>
        prev.map((thread) => ({
          ...thread,
          messages: thread.messages.map((msg) => {
            if (msg.senderId === userId && msg.status === 'sending') {
              return { ...msg, status: 'sent' as MessageStatus };
            }
            if (msg.senderId === userId && msg.status === 'sent') {
              return { ...msg, status: 'delivered' as MessageStatus };
            }
            return msg;
          }),
        })),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [userId, useApi, updateThreads]);

  const ensureThreadFromChatId = useCallback(
    async (chatId: string): Promise<boolean> => {
      if (!userId) return false;

      if (useApi) {
        if (!isUuidString(chatId)) return false;
        if (threads.some((t) => t.id === chatId)) {
          socketRef.current?.subscribeChat(chatId);
          return true;
        }
        try {
          const summary = await fetchChatById(chatId);
          upsertSummary(summary);
          return true;
        } catch {
          return false;
        }
      }

      const participants = parseDmChatId(chatId);
      if (!participants || !participants.includes(userId)) return false;
      updateThreads((prev) => {
        if (prev.some((t) => t.id === chatId)) return prev;
        return [...prev, createDmThread(chatId, participants)];
      });
      return true;
    },
    [userId, useApi, threads, upsertSummary, updateThreads],
  );

  const ensureThreadWith = useCallback(
    async (otherUserId: string, listingId?: string): Promise<string> => {
      if (!userId) {
        throw new Error('Создание чата доступно только после входа.');
      }

      if (useApi) {
        const summary = await createOrGetChat({
          otherUserId,
          listingId: listingId && isUuidString(listingId) ? listingId : undefined,
        });
        upsertSummary(summary);
        return summary.id;
      }

      const id = makeDmChatId(userId, otherUserId);
      updateThreads((prev) => {
        if (prev.some((t) => t.id === id)) {
          if (!listingId) return prev;
          return prev.map((t) => (t.id === id ? { ...t, listingId } : t));
        }
        return [...prev, { ...createDmThread(id, [userId, otherUserId]), listingId: listingId ?? null }];
      });
      return id;
    },
    [userId, useApi, upsertSummary, updateThreads],
  );

  const loadThreadMessages = useCallback(
    async (chatId: string) => {
      if (!userId || !useApi) return;
      const dtos = await fetchChatMessages(chatId);
      updateThreads((prev) =>
        prev.map((t) =>
          t.id === chatId
            ? {
                ...t,
                messages: dtos.map((d) => mapMessageDto(d, userId)),
              }
            : t,
        ),
      );
    },
    [userId, useApi, updateThreads],
  );

  const sendMessage = useCallback(
    async (chatId: string, body: string, replyToId?: string) => {
      if (!userId) return;
      const sanitized = sanitizeMessage(body);
      if (!sanitized) return;

      if (useApi) {
        const tempId = generateUniqueId('m');
        const optimistic: Message = {
          id: tempId,
          senderId: userId,
          body: sanitized,
          sentAt: new Date().toISOString(),
          status: 'sending',
          replyToId,
        };
        updateThreads((prev) =>
          prev.map((t) =>
            t.id === chatId
              ? {
                  ...t,
                  messages: [...t.messages, optimistic],
                  hiddenFromList: false,
                  lastActivityAt: optimistic.sentAt,
                }
              : t,
          ),
        );
        try {
          const saved = await postChatMessage(chatId, sanitized);
          const mapped = mapMessageDto(saved, userId);
          updateThreads((prev) =>
            prev.map((t) =>
              t.id === chatId
                ? {
                    ...t,
                    messages: [
                      ...t.messages.filter((m) => m.id !== tempId && m.id !== mapped.id),
                      mapped,
                    ],
                    hiddenFromList: false,
                    lastActivityAt: saved.sentAt,
                  }
                : t,
            ),
          );
        } catch {
          updateThreads((prev) =>
            prev.map((t) =>
              t.id === chatId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === tempId ? { ...m, status: 'error' as MessageStatus } : m,
                    ),
                  }
                : t,
            ),
          );
        }
        return;
      }

      const msg: Message = {
        id: generateUniqueId('m'),
        senderId: userId,
        body: sanitized,
        sentAt: new Date().toISOString(),
        status: 'sending',
        replyToId,
      };
      updateThreads((prev) => {
        const existing = prev.find((t) => t.id === chatId);
        if (existing) {
          return prev.map((t) =>
            t.id === chatId
              ? {
                  ...t,
                  messages: [...t.messages, msg],
                  hiddenFromList: false,
                  lastActivityAt: msg.sentAt,
                }
              : t,
          );
        }
        const participants = parseDmChatId(chatId);
        if (!participants || !participants.includes(userId)) return prev;
        const thread = createDmThread(chatId, participants);
        thread.messages = [msg];
        thread.hiddenFromList = false;
        thread.lastActivityAt = msg.sentAt;
        return [...prev, thread];
      });
    },
    [userId, useApi, updateThreads],
  );

  const editMessage = useCallback(
    (chatId: string, messageId: string, newBody: string) => {
      if (!userId || useApi) return;
      const sanitized = sanitizeMessage(newBody);
      if (!sanitized) return;
      updateThreads((prev) =>
        prev.map((t) =>
          t.id === chatId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId && m.senderId === userId
                    ? { ...m, body: sanitized, isEdited: true, editedAt: new Date().toISOString() }
                    : m,
                ),
              }
            : t,
        ),
      );
    },
    [userId, useApi, updateThreads],
  );

  const deleteMessage = useCallback(
    (chatId: string, messageId: string) => {
      if (!userId || useApi) return;
      updateThreads((prev) =>
        prev.map((t) =>
          t.id === chatId
            ? {
                ...t,
                messages: t.messages.filter((m) => !(m.id === messageId && m.senderId === userId)),
              }
            : t,
        ),
      );
    },
    [userId, useApi, updateThreads],
  );

  const markAsRead = useCallback(
    async (chatId: string) => {
      if (!userId) return;
      if (useApi) {
        try {
          await markChatRead(chatId);
        } catch {
          return;
        }
      }
      updateThreads((prev) =>
        prev.map((t) =>
          t.id === chatId
            ? {
                ...t,
                unreadCount: 0,
                messages: t.messages.map((m) =>
                  m.senderId !== userId && m.status !== 'read' ? { ...m, status: 'read' as MessageStatus } : m,
                ),
              }
            : t,
        ),
      );
    },
    [userId, useApi, updateThreads],
  );

  const clearChat = useCallback(
    async (chatId: string) => {
      if (!userId) return;
      if (useApi) {
        await clearChatHistory(chatId);
      }
      updateThreads((prev) =>
        prev.map((t) =>
          t.id === chatId
            ? {
                ...t,
                messages: [],
                unreadCount: 0,
                hiddenFromList: true,
              }
            : t,
        ),
      );
    },
    [userId, useApi, updateThreads],
  );

  const refreshChats = useCallback(async () => {
    if (!userId || !useApi) return;
    try {
      const list = await fetchMyChats();
      const mapped = list.map((s) => mapSummaryToThread(s, userId));
      setThreads((prev) => {
        const fromApi = normalizeThreads(mapped);
        const apiIds = new Set(fromApi.map((t) => t.id));
        const localHidden = prev.filter((t) => t.hiddenFromList && !apiIds.has(t.id));
        return normalizeThreads([...fromApi, ...localHidden]);
      });
      subscribeAllThreads();
    } catch {
      /* ignore */
    }
  }, [userId, useApi, normalizeThreads, subscribeAllThreads]);

  const setTyping = useCallback(
    (chatId: string, isTyping: boolean) => {
      if (useApi) return;
      const existing = typingTimeouts.current.get(chatId);
      if (existing) clearTimeout(existing);
      if (isTyping) {
        const timeout = setTimeout(() => {
          updateThreads((prev) => prev.map((t) => (t.id === chatId ? { ...t, isTyping: false } : t)));
        }, 3000);
        typingTimeouts.current.set(chatId, timeout);
      }
      updateThreads((prev) => prev.map((t) => (t.id === chatId ? { ...t, isTyping } : t)));
    },
    [useApi, updateThreads],
  );

  const getThread = useCallback(
    (chatId: string) => {
      const direct = threads.find((t) => t.id === chatId);
      if (direct) return direct;
      const uid = userIdRef.current;
      if (!uid) return undefined;
      const parsed = parseDmChatId(chatId);
      if (!parsed?.includes(uid)) return undefined;
      const otherId = parsed.find((id) => id !== uid);
      if (!otherId) return undefined;
      return threads.find((t) => t.participantIds.includes(otherId));
    },
    [threads],
  );

  const getTotalUnread = useCallback(() => {
    return threads
      .filter(isChatVisibleInList)
      .reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);
  }, [threads]);

  const value = useMemo(
    () => ({
      threads,
      isLoading,
      ensureThreadWith,
      ensureThreadFromChatId,
      loadThreadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      markAsRead,
      clearChat,
      refreshChats,
      getThread,
      getTotalUnread,
      setTyping,
    }),
    [
      threads,
      isLoading,
      ensureThreadWith,
      ensureThreadFromChatId,
      loadThreadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      markAsRead,
      clearChat,
      refreshChats,
      getThread,
      getTotalUnread,
      setTyping,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStore() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatStore должен вызываться внутри ChatProvider');
  return ctx;
}
