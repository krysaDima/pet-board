import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { mockProfiles } from '@/api/mocks/data';
import { useChatStore } from '@/app/chat/ChatProvider';
import { useAuth } from '@/app/auth/AuthContext';
import { Card } from '@/shared/ui/Card';
import { Avatar } from '@/shared/ui/Avatar';

/** Список чатов (демо: в памяти + начальные из моков). */
export function ChatsPage() {
  const { threads } = useChatStore();
  const { userId } = useAuth();

  function titleFor(thread: { participantIds: string[] }): string {
    if (!userId) return 'Чат';
    const otherId = thread.participantIds.find((id) => id !== userId);
    if (!otherId) return 'Чат';
    return mockProfiles[otherId]?.displayName ?? otherId;
  }

  function avatarFor(thread: { participantIds: string[] }): string | undefined {
    if (!userId) return undefined;
    const otherId = thread.participantIds.find((id) => id !== userId);
    if (!otherId) return undefined;
    return mockProfiles[otherId]?.avatarUrl;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Чаты</h1>
      {threads.length === 0 ? (
        <Card>
          <p className="text-stone-600">Пока нет диалогов. Откройте объявление и нажмите «Написать».</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {threads.map((t) => {
            const last = t.messages[t.messages.length - 1];
            const av = avatarFor(t);
            return (
              <li key={t.id}>
                <Link to={ROUTES.chatThread(t.id)} className="block touch-manipulation active:opacity-90">
                  <Card className="flex min-h-[72px] items-center gap-4 transition md:hover:border-amber-200 md:hover:shadow-md">
                    {av ? <Avatar src={av} alt="" size="md" /> : <div className="h-14 w-14 rounded-2xl bg-stone-200" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">{titleFor(t)}</p>
                      <p className="truncate text-sm text-stone-500">
                        {last ? last.body : 'Нет сообщений — напишите первым'}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
