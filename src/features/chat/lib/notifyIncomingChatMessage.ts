import type { MessageDto } from '@/api/chatApi';
import { isChatSoundEnabled } from '@/features/chat/lib/chatSoundSettings';
import { playChatMessageSound } from '@/features/chat/lib/playChatMessageSound';

function getOpenChatId(): string | null {
  const match = window.location.pathname.match(/\/chats\/([^/]+)/);
  return match?.[1] ?? null;
}

function shouldPlayForChat(chatId: string): boolean {
  if (!isChatSoundEnabled()) return false;
  if (!document.hasFocus()) return true;
  return getOpenChatId() !== chatId;
}

function previewText(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Новое сообщение';
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
}

function showDesktopNotification(chatId: string, body: string, title = 'Новое сообщение'): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return;

  try {
    const n = new Notification(title, {
      body,
      tag: `chat-${chatId}`,
      silent: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

type Params = {
  chatId: string;
  message: MessageDto;
  senderName?: string;
};

/** Звук и (при свёрнутой вкладке) системное уведомление о входящем сообщении. */
export function notifyIncomingChatMessage({ chatId, message, senderName }: Params): void {
  const title = senderName ? `${senderName}` : 'Новое сообщение';
  const body = previewText(message.content);

  if (shouldPlayForChat(chatId)) {
    playChatMessageSound();
  }

  showDesktopNotification(chatId, body, title);
}
