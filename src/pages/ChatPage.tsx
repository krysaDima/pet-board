import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { mockProfiles } from '@/api/mocks/data';
import { useChatStore } from '@/app/chat/ChatProvider';
import { useAuth } from '@/app/auth/AuthContext';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Avatar } from '@/shared/ui/Avatar';

/** Экран переписки: сообщения в памяти, отправка без сервера. Адаптив под мобильные. */
export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { userId } = useAuth();
  const { getThread, sendMessage } = useChatStore();
  const [draft, setDraft] = useState('');

  const thread = chatId ? getThread(chatId) : undefined;

  const title = useMemo(() => {
    if (!thread || !userId) return 'Чат';
    const otherId = thread.participantIds.find((id) => id !== userId);
    if (!otherId) return 'Чат';
    return mockProfiles[otherId]?.displayName ?? otherId;
  }, [thread, userId]);

  const otherAvatar = useMemo(() => {
    if (!thread || !userId) return undefined;
    const otherId = thread.participantIds.find((id) => id !== userId);
    if (!otherId) return undefined;
    return mockProfiles[otherId]?.avatarUrl;
  }, [thread, userId]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatId) return;
    sendMessage(chatId, draft);
    setDraft('');
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.chats}
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-amber-800 hover:underline"
        >
          ← Все чаты
        </Link>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        {otherAvatar ? <Avatar src={otherAvatar} alt="" size="md" /> : null}
        <h1 className="min-w-0 truncate text-lg font-bold text-stone-900 sm:text-xl">{title}</h1>
      </div>

      <Card className="flex max-h-[min(65dvh,560px)] min-h-[min(42dvh,300px)] flex-col gap-3 overflow-hidden p-3 sm:max-h-[min(60vh,520px)] sm:min-h-[280px] sm:p-4">
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          {thread.messages.length === 0 ? (
            <li className="text-center text-sm text-stone-500">Напишите первое сообщение.</li>
          ) : (
            thread.messages.map((m) => {
              const mine = userId != null && m.senderId === userId;
              return (
                <li
                  key={m.id}
                  className={`max-w-[min(92%,20rem)] rounded-2xl px-3 py-2 text-sm sm:max-w-[85%] sm:px-4 ${
                    mine ? 'self-end bg-amber-600 text-white' : 'self-start bg-stone-100 text-stone-900'
                  }`}
                >
                  <p className="break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-amber-100' : 'text-stone-400'}`}>
                    {new Date(m.sentAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </li>
              );
            })
          )}
        </ul>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-stretch sm:gap-2"
        >
          <input
            className="min-h-[48px] flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-base text-stone-900 outline-none ring-amber-500/30 focus:ring-2 sm:min-h-0 sm:text-sm"
            placeholder="Сообщение…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            enterKeyHint="send"
            aria-label="Текст сообщения"
          />
          <Button type="submit" variant="primary" className="w-full sm:w-auto sm:shrink-0" disabled={!draft.trim()}>
            Отправить
          </Button>
        </form>
      </Card>
    </div>
  );
}
