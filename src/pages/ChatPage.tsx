import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/shared/config/routes';
import { fetchChatById, isChatApiEnabled } from '@/api/chatApi';
import { canFetchPublicUserProfile, fetchListingById, fetchProfile, isApiMocksMode } from '@/api/listingsApi';
import { mockProfiles } from '@/api/mocks/data';
import { useBlockedUsers } from '@/app/block/BlockedUsersProvider';
import { useAppNotice } from '@/app/notice/AppNoticeProvider';
import { useChatStore } from '@/app/chat/ChatProvider';
import { BlockUserConfirmModal } from '@/features/chat/ui/BlockUserConfirmModal';
import { ChatClearConfirmModal } from '@/features/chat/ui/ChatClearConfirmModal';
import { ChatSoundToggle } from '@/features/chat/ui/ChatSoundToggle';
import { ChatClearOverlay } from '@/features/chat/ui/ChatClearOverlay';
import { ChatListingBanner } from '@/features/chat/ui/ChatListingBanner';
import { ChatListingUnavailable } from '@/features/chat/ui/ChatListingUnavailable';
import { useAuth } from '@/app/auth/AuthContext';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Avatar } from '@/shared/ui/Avatar';
import { EmojiPicker } from '@/shared/ui/EmojiPicker';
import { MessageStatus } from '@/shared/ui/MessageStatus';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Message } from '@/entities/chat/model/types';

/** Экран переписки с современным функционалом */
export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { blockUser, isBlockedByMe, isUserHidden } = useBlockedUsers();
  const notice = useAppNotice();
  const {
    getThread,
    ensureThreadFromChatId,
    loadThreadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    clearChat,
    refreshChats,
  } = useChatStore();
  const apiChat = isChatApiEnabled();
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const [clearPhase, setClearPhase] = useState<'idle' | 'exiting' | 'clearing' | 'success'>('idle');
  const [exitSnapshot, setExitSnapshot] = useState<Message[] | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const thread = chatId ? getThread(chatId) : undefined;

  useLayoutEffect(() => {
    if (chatId && !thread) {
      void ensureThreadFromChatId(chatId);
    }
  }, [chatId, thread, ensureThreadFromChatId]);

  useEffect(() => {
    if (chatId && apiChat) {
      void loadThreadMessages(chatId);
    }
  }, [chatId, apiChat, loadThreadMessages]);

  const otherId = useMemo(() => {
    if (!thread || !userId) return null;
    return thread.participantIds.find((id) => id !== userId) ?? null;
  }, [thread, userId]);

  const { data: otherProfile } = useQuery({
    queryKey: otherId ? queryKeys.profile(otherId) : queryKeys.profile('__skip__'),
    queryFn: () => fetchProfile(otherId!),
    enabled: Boolean(otherId) && (isApiMocksMode() || canFetchPublicUserProfile(otherId!)),
  });

  const otherUser = useMemo(() => {
    if (!otherId) return null;
    if (isApiMocksMode()) return mockProfiles[otherId] ?? null;
    return otherProfile ?? null;
  }, [otherId, otherProfile]);

  const title = otherUser?.displayName ?? 'Чат';

  const { data: chatSummary } = useQuery({
    queryKey: chatId ? queryKeys.chat(chatId) : queryKeys.chat('__skip__'),
    queryFn: () => fetchChatById(chatId!),
    enabled: Boolean(chatId) && apiChat,
  });

  const listingId = thread?.listingId ?? chatSummary?.listingId ?? null;

  const listingQuery = useQuery({
    queryKey: listingId ? queryKeys.listing(listingId) : queryKeys.listing('__skip__'),
    queryFn: () => fetchListingById(listingId!),
    enabled: Boolean(listingId),
  });

  useEffect(() => {
    if (chatId && thread?.unreadCount) {
      void markAsRead(chatId);
    }
  }, [chatId, thread?.unreadCount, markAsRead]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  // Закрытие контекстного меню при клике вне
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  useEffect(() => {
    if (!headerMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [headerMenuOpen]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setDraft((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatId || !draft.trim()) return;

    if (editingMessage) {
      editMessage(chatId, editingMessage.id, draft);
      setEditingMessage(null);
      setDraft('');
      return;
    }

    void sendMessage(chatId, draft, replyTo?.id);
    setReplyTo(null);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
    if (e.key === 'Escape') {
      if (editingMessage) {
        setEditingMessage(null);
        setDraft('');
      }
      if (replyTo) {
        setReplyTo(null);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message);
    setDraft(message.body);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleDelete = (message: Message) => {
    if (chatId && window.confirm('Удалить сообщение?')) {
      deleteMessage(chatId, message.id);
    }
    setContextMenu(null);
  };

  const startReply = (message: Message) => {
    setReplyTo(message);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setContextMenu(null);
  };

  const performBlockUser = useCallback(async () => {
    if (!otherId) return;
    try {
      await blockUser(otherId);
      await refreshChats();
      notice.success('Пользователь заблокирован');
      navigate(ROUTES.chats);
    } catch {
      notice.error('Не удалось заблокировать', 'Попробуйте ещё раз.');
    }
  }, [otherId, blockUser, refreshChats, navigate]);

  const performClearChat = useCallback(async () => {
    if (!chatId || !thread || clearPhase !== 'idle') return;
    const snapshot = [...thread.messages];
    setExitSnapshot(snapshot);
    setClearPhase('exiting');

    const exitMs = snapshot.length === 0 ? 0 : Math.min(1100, 280 + snapshot.length * 48);
    await new Promise((r) => setTimeout(r, exitMs));

    setClearPhase('clearing');
    try {
      await clearChat(chatId);
      setExitSnapshot(null);
      setClearPhase('success');
      await new Promise((r) => setTimeout(r, 1400));
    } catch {
      setExitSnapshot(null);
      notice.error('Не удалось очистить чат', 'Попробуйте ещё раз.');
    } finally {
      setClearPhase('idle');
    }
  }, [chatId, thread, clearPhase, clearChat]);

  const displayedMessages = exitSnapshot ?? thread?.messages ?? [];
  const isClearAnimating = clearPhase !== 'idle';
  const overlayPhase =
    clearPhase === 'clearing' ? 'clearing' : clearPhase === 'success' ? 'success' : 'idle';

  const getReplyMessage = (replyToId: string | undefined) => {
    if (!replyToId) return null;
    return displayedMessages.find((m) => m.id === replyToId) ?? null;
  };

  if (!chatId) {
    return <p className="text-stone-600">Чат не указан.</p>;
  }

  if (!thread) {
    return (
      <div className="space-y-3">
        <p className="text-stone-600">Такого чата нет (возможно, ссылка устарела после перезагрузки).</p>
        <Link to={ROUTES.chats} className="inline-flex min-h-[44px] items-center font-medium text-amber-800 underline">
          К списку чатов
        </Link>
      </div>
    );
  }

  if (otherId && isUserHidden(otherId)) {
    return (
      <div className="space-y-3">
        <p className="text-stone-600">Этот пользователь заблокирован. Переписка недоступна.</p>
        <Link to={ROUTES.chats} className="inline-flex min-h-[44px] items-center font-medium text-amber-800 underline">
          К списку чатов
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={ROUTES.chats}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
      >
        ← Все чаты
      </Link>

      {/* Информация о собеседнике */}
      <div className="flex min-w-0 items-center gap-3">
        {otherId && (isApiMocksMode() || canFetchPublicUserProfile(otherId)) ? (
          <Link
            to={ROUTES.profile(otherId)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            <Avatar src={otherUser?.avatarUrl ?? ''} alt={title} size="md" mediaAuthFallback={!isApiMocksMode()} />
            <div className="min-w-0 flex-1">
              <h1 className="min-w-0 truncate text-lg font-bold text-stone-900 sm:text-xl">{title}</h1>
              {thread.isTyping ? (
                <p className="text-sm text-amber-600 animate-pulse">печатает...</p>
              ) : null}
            </div>
          </Link>
        ) : (
          <>
            <Avatar src={otherUser?.avatarUrl ?? ''} alt={title} size="md" mediaAuthFallback={!isApiMocksMode()} />
            <div className="min-w-0 flex-1">
              <h1 className="min-w-0 truncate text-lg font-bold text-stone-900 sm:text-xl">{title}</h1>
              {thread.isTyping ? (
                <p className="text-sm text-amber-600 animate-pulse">печатает...</p>
              ) : null}
            </div>
          </>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-stone-500">онлайн</span>
          </span>
          <ChatSoundToggle />
          <div className="relative" ref={headerMenuRef}>
            <button
              type="button"
              className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
              aria-label="Действия чата"
              aria-expanded={headerMenuOpen}
              disabled={isClearAnimating}
              onClick={(e) => {
                e.stopPropagation();
                setHeaderMenuOpen((v) => !v);
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {headerMenuOpen ? (
              <div className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                {otherId && !isBlockedByMe(otherId) ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-800 hover:bg-stone-50"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setBlockConfirmOpen(true);
                    }}
                  >
                    <span aria-hidden>🚫</span>
                    Заблокировать
                  </button>
                ) : null}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setClearConfirmOpen(true);
                  }}
                >
                  <span aria-hidden>🧹</span>
                  Очистить историю
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {listingId && listingQuery.isPending ? (
        <p className="text-xs text-stone-500">Загрузка объявления…</p>
      ) : null}
      {listingId && listingQuery.data && chatId ? (
        <ChatListingBanner listing={listingQuery.data} chatId={chatId} />
      ) : null}
      {listingId && !listingQuery.isPending && !listingQuery.data ? <ChatListingUnavailable /> : null}

      <Card className="relative flex max-h-[min(72dvh,560px)] min-h-[min(50dvh,420px)] flex-col gap-3 overflow-hidden p-3 max-sm:max-h-[calc(100dvh-13rem)] max-sm:min-h-[min(58dvh,480px)] sm:max-h-[min(60vh,520px)] sm:min-h-[280px] sm:p-4">
        <ChatClearOverlay phase={overlayPhase} />
        {/* Сообщения */}
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          {displayedMessages.length === 0 ? (
            <li className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <span className="text-4xl">💬</span>
              <p className="text-sm text-stone-500">Напишите первое сообщение!</p>
            </li>
          ) : (
            displayedMessages.map((m, index) => {
              const mine = userId != null && m.senderId === userId;
              const replyMsg = getReplyMessage(m.replyToId);
              const exiting = clearPhase === 'exiting';
              return (
                <li
                  key={m.id}
                  style={exiting ? { animationDelay: `${index * 48}ms` } : undefined}
                  className={`group relative max-w-[min(92%,20rem)] rounded-2xl px-3 py-2 text-sm sm:max-w-[85%] sm:px-4 ${
                    exiting ? 'chat-msg-exit' : ''
                  } ${
                    mine
                      ? 'self-end bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md'
                      : 'self-start bg-stone-100 text-stone-900 shadow-sm'
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, m)}
                >
                  {/* Цитируемое сообщение */}
                  {replyMsg && (
                    <div
                      className={`mb-2 rounded-lg px-2 py-1 text-xs ${
                        mine ? 'bg-amber-400/30 border-l-2 border-amber-200' : 'bg-stone-200 border-l-2 border-stone-400'
                      }`}
                    >
                      <p className="font-medium truncate">
                        {replyMsg.senderId === userId ? 'Вы' : title}
                      </p>
                      <p className="truncate opacity-80">{replyMsg.body}</p>
                    </div>
                  )}

                  <p className="break-words whitespace-pre-wrap">{m.body}</p>

                  <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'text-amber-100' : 'text-stone-400'}`}>
                    {m.isEdited && <span className="italic">изм.</span>}
                    <span>
                      {new Date(m.sentAt).toLocaleString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {mine && <MessageStatus status={m.status} className={mine ? 'text-amber-100' : ''} />}
                  </div>

                  {/* Быстрые действия при наведении */}
                  <div
                    className={`absolute top-1 ${mine ? 'left-1' : 'right-1'} hidden gap-0.5 group-hover:flex`}
                  >
                    <button
                      type="button"
                      onClick={() => startReply(m)}
                      className="rounded-full bg-white/90 p-1 text-stone-600 shadow hover:bg-white"
                      title="Ответить"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 10l7-7v4c11 0 11 9 11 13-2-4-5-5-11-5v4l-7-7z" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </ul>

        {/* Контекстное меню */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-[140px] rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              type="button"
              onClick={() => startReply(contextMenu.message)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <span>↩️</span> Ответить
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(contextMenu.message.body)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <span>📋</span> Копировать
            </button>
            {contextMenu.message.senderId === userId && !apiChat && (
              <>
                <button
                  type="button"
                  onClick={() => startEdit(contextMenu.message)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <span>✏️</span> Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(contextMenu.message)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <span>🗑️</span> Удалить
                </button>
              </>
            )}
          </div>
        )}

        {/* Ответ на сообщение */}
        {replyTo && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-amber-800">
                Ответ на {replyTo.senderId === userId ? 'своё сообщение' : title}
              </p>
              <p className="truncate text-sm text-stone-600">{replyTo.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Редактирование */}
        {editingMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-800">Редактирование</p>
              <p className="truncate text-sm text-stone-600">{editingMessage.body}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingMessage(null);
                setDraft('');
              }}
              className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Форма ввода */}
        <form
          onSubmit={onSubmit}
          className={`flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-stretch sm:gap-2 ${
            isClearAnimating ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <div className="relative flex min-h-[48px] flex-1 items-center gap-2 rounded-xl border border-stone-200 px-3 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 sm:min-h-0">
            {/* Кнопка эмодзи */}
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg text-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              title="Эмодзи"
            >
              😊
            </button>

            {showEmoji && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
            )}

            <input
              ref={inputRef}
              className="min-h-[40px] flex-1 bg-transparent py-2 text-base text-stone-900 outline-none placeholder:text-stone-400 sm:min-h-0 sm:text-sm"
              placeholder={editingMessage ? 'Редактирование...' : 'Сообщение…'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              enterKeyHint="send"
              aria-label="Текст сообщения"
              maxLength={2000}
            />

            {/* Счётчик символов */}
            {draft.length > 1800 && (
              <span className={`text-xs ${draft.length > 1950 ? 'text-red-500' : 'text-stone-400'}`}>
                {draft.length}/2000
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto sm:shrink-0"
            disabled={!draft.trim()}
          >
            {editingMessage ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </Button>
        </form>
      </Card>

      <ChatClearConfirmModal
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={() => void performClearChat()}
      />
      {otherId ? (
        <BlockUserConfirmModal
          open={blockConfirmOpen}
          displayName={title}
          onClose={() => setBlockConfirmOpen(false)}
          onConfirm={() => void performBlockUser()}
        />
      ) : null}
    </div>
  );
}
