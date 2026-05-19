import { useCallback, useSyncExternalStore } from 'react';
import { isChatSoundEnabled, setChatSoundEnabled } from '@/features/chat/lib/chatSoundSettings';
import { playChatMessageSound, warmupChatAudio } from '@/features/chat/lib/playChatMessageSound';

const SOUND_EVENT = 'pet-board-chat-sound-change';

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(SOUND_EVENT, handler);
  return () => window.removeEventListener(SOUND_EVENT, handler);
}

function getSnapshot() {
  return isChatSoundEnabled();
}

/** Переключатель звуковых уведомлений в чатах. */
export function ChatSoundToggle({ className = '' }: { className?: string }) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, () => true);

  const toggle = useCallback(() => {
    const next = !isChatSoundEnabled();
    setChatSoundEnabled(next);
    window.dispatchEvent(new Event(SOUND_EVENT));
    if (next) {
      warmupChatAudio();
      playChatMessageSound();
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${className}`}
      aria-pressed={enabled}
      aria-label={enabled ? 'Выключить звук сообщений' : 'Включить звук сообщений'}
      title={enabled ? 'Звук включён' : 'Звук выключен'}
    >
      {enabled ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M11 5 6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a9 9 0 0 1 0 12.73" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M11 5 6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 9l-6 6M17 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
