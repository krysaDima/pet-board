import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/shared/config/routes';
import { canFetchPublicUserProfile, fetchProfile, isApiMocksMode } from '@/api/listingsApi';
import { mockProfiles } from '@/api/mocks/data';
import { useBlockedUsers } from '@/app/block/BlockedUsersProvider';
import { useAppNotice } from '@/app/notice/AppNoticeProvider';
import { useChatStore } from '@/app/chat/ChatProvider';
import { useAuth } from '@/app/auth/AuthContext';
import { Card } from '@/shared/ui/Card';
import { Avatar } from '@/shared/ui/Avatar';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { ChatThread } from '@/entities/chat/model/types';
import { dedupeChatThreadsByOtherUser } from '@/entities/chat/lib/dedupeChatThreads';
import { isChatVisibleInList } from '@/entities/chat/lib/isChatVisibleInList';
import { ChatClearConfirmModal } from '@/features/chat/ui/ChatClearConfirmModal';
import { ChatSoundToggle } from '@/features/chat/ui/ChatSoundToggle';
import type { PublicProfile } from '@/entities/user/model/types';

/** Запрос разрешения на уведомления */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/** Форматирование времени последнего сообщения */
function formatLastTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'сейчас';
  if (diffMins < 60) return `${diffMins} мин`;
  if (diffHours < 24) return `${diffHours} ч`;
  if (diffDays < 7) return `${diffDays} дн`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** Карточка одного диалога в списке */
function ChatThreadRow({
  thread,
  userId,
  onClear,
}: {
  thread: ChatThread;
  userId: string;
  onClear: (chatId: string) => void;
}) {
  const otherId = thread.participantIds.find((id) => id !== userId);
  const { data: otherProfile } = useQuery({
    queryKey: otherId ? queryKeys.profile(otherId) : queryKeys.profile('__skip__'),
    queryFn: () => fetchProfile(otherId!),
    enabled: Boolean(otherId) && (isApiMocksMode() || canFetchPublicUserProfile(otherId!)),
  });

  const other: PublicProfile | null = useMemo(() => {
    if (!otherId) return null;
    if (isApiMocksMode()) return mockProfiles[otherId] ?? null;
    return otherProfile ?? null;
  }, [otherId, otherProfile]);

  const last = thread.messages[thread.messages.length - 1];
  const hasUnread = (thread.unreadCount ?? 0) > 0;
  const isLastMine = last?.senderId === userId;

  return (
    <li>
      <Link to={ROUTES.chatThread(thread.id)} className="block touch-manipulation active:opacity-90">
        <Card
          className={`flex min-h-[76px] items-center gap-4 transition md:hover:border-amber-200 md:hover:shadow-md ${
            hasUnread ? 'border-amber-300 bg-amber-50/50' : ''
          }`}
        >
          <div className="relative shrink-0">
            {other?.avatarUrl ? (
              <Avatar src={other.avatarUrl} alt="" size="md" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-xl font-bold text-amber-800">
                {other?.displayName?.charAt(0) ?? '?'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`truncate font-semibold ${hasUnread ? 'text-stone-900' : 'text-stone-700'}`}>
                {other?.displayName ?? 'Пользователь'}
              </p>
              {last && (
                <span className="shrink-0 text-xs text-stone-400">
                  {formatLastTime(last.sentAt)}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <p className={`min-w-0 flex-1 truncate text-sm ${hasUnread ? 'font-medium text-stone-700' : 'text-stone-500'}`}>
                {last ? (
                  <>
                    {isLastMine && <span className="text-stone-400">Вы: </span>}
                    {last.body}
                  </>
                ) : (
                  <span className="italic text-stone-400">Нет сообщений — напишите первым</span>
                )}
              </p>
              {hasUnread && (
                <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {thread.unreadCount}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            title="Очистить чат у себя"
            aria-label="Очистить чат у себя"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-red-600"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear(thread.id);
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2m-1 14H9a1 1 0 0 1-1-1V7h12v12a1 1 0 0 1-1 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </Card>
      </Link>
    </li>
  );
}

/** Список чатов с уведомлениями и статусами */
export function ChatsPage() {
  const { threads, getTotalUnread, isLoading, clearChat, refreshChats } = useChatStore();
  const { userId } = useAuth();
  const { isUserHidden } = useBlockedUsers();
  const notice = useAppNotice();
  const [clearConfirmChatId, setClearConfirmChatId] = useState<string | null>(null);

  const handleClearThread = (chatId: string) => {
    setClearConfirmChatId(chatId);
  };

  const confirmClearThread = () => {
    if (!clearConfirmChatId) return;
    const id = clearConfirmChatId;
    void clearChat(id).catch(() => {
      notice.error('Не удалось очистить чат', 'Попробуйте ещё раз.');
    });
  };

  // Запрос разрешения на уведомления при монтировании
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    void refreshChats();
  }, [refreshChats]);

  // Обновление title страницы при непрочитанных
  useEffect(() => {
    const unread = getTotalUnread();
    document.title = unread > 0 ? `(${unread}) Чаты | PetBoard` : 'Чаты | PetBoard';
    return () => {
      document.title = 'PetBoard';
    };
  }, [getTotalUnread]);

  // Сортировка по последней активности
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      const aTime = a.lastActivityAt ?? a.messages[a.messages.length - 1]?.sentAt ?? '';
      const bTime = b.lastActivityAt ?? b.messages[b.messages.length - 1]?.sentAt ?? '';
      return bTime.localeCompare(aTime);
    });
  }, [threads]);

  const visibleThreads = useMemo(() => {
    if (!userId) return [];
    const filtered = sortedThreads.filter((t) => {
      const otherId = t.participantIds.find((id) => id !== userId);
      if (!otherId) return false;
      if (isUserHidden(otherId)) return false;
      return isChatVisibleInList(t);
    });
    return dedupeChatThreadsByOtherUser(filtered, userId);
  }, [sortedThreads, userId, isUserHidden]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
          Чаты
          {getTotalUnread() > 0 && (
            <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-sm font-bold text-white">
              {getTotalUnread()}
            </span>
          )}
        </h1>
        <ChatSoundToggle />
      </div>

      {isLoading ? (
        <Card className="py-12 text-center text-stone-500">Загрузка чатов…</Card>
      ) : visibleThreads.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            <span className="text-5xl">💬</span>
            <p className="mt-3 text-lg font-medium text-stone-700">Пока нет диалогов</p>
            <p className="mt-1 text-sm text-stone-500">
              Откройте объявление и нажмите «Написать», чтобы начать общение
            </p>
            <Link
              to={ROUTES.board}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
            >
              К объявлениям →
            </Link>
          </div>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visibleThreads.map((t) => (
            userId ? (
              <ChatThreadRow key={t.id} thread={t} userId={userId} onClear={handleClearThread} />
            ) : null
          ))}
        </ul>
      )}

      <ChatClearConfirmModal
        open={clearConfirmChatId != null}
        onClose={() => setClearConfirmChatId(null)}
        onConfirm={confirmClearThread}
      />
    </div>
  );
}
