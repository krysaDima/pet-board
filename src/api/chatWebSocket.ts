import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBaseUrl, getValidAccessToken } from '@/api/client';
import type { MessageDto } from '@/api/chatApi';

export type ChatReadEventDto = {
  chatId: string;
  readByUserId: string;
};

export type ChatSocketHandlers = {
  onMessage: (chatId: string, message: MessageDto) => void;
  onRead: (event: ChatReadEventDto) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
};

/** STOMP-клиент для подписки на чаты в реальном времени. */
export class ChatSocketClient {
  client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription[]>();
  private handlers: ChatSocketHandlers;

  constructor(handlers: ChatSocketHandlers) {
    this.handlers = handlers;
  }

  async connect(): Promise<void> {
    const token = await getValidAccessToken();
    if (!token) return;

    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${getApiBaseUrl()}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: async () => {
        const fresh = await getValidAccessToken();
        if (fresh && this.client) {
          this.client.connectHeaders = { Authorization: `Bearer ${fresh}` };
        }
      },
      onConnect: () => {
        this.handlers.onConnected?.();
      },
      onDisconnect: () => {
        this.handlers.onDisconnected?.();
      },
      onStompError: () => {
        this.handlers.onDisconnected?.();
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    this.unsubscribeAll();
    void this.client?.deactivate();
    this.client = null;
  }

  subscribeChat(chatId: string): void {
    if (!this.client?.connected) return;
    if (this.subscriptions.has(chatId)) return;

    const subs: StompSubscription[] = [];

    subs.push(
      this.client.subscribe(`/topic/chats/${chatId}`, (frame: IMessage) => {
        try {
          const message = JSON.parse(frame.body) as MessageDto;
          this.handlers.onMessage(chatId, message);
        } catch {
          /* ignore malformed payload */
        }
      }),
    );

    subs.push(
      this.client.subscribe(`/topic/chats/${chatId}/read`, (frame: IMessage) => {
        try {
          const event = JSON.parse(frame.body) as ChatReadEventDto;
          this.handlers.onRead(event);
        } catch {
          /* ignore */
        }
      }),
    );

    this.subscriptions.set(chatId, subs);
  }

  unsubscribeChat(chatId: string): void {
    const subs = this.subscriptions.get(chatId);
    if (!subs) return;
    subs.forEach((s) => s.unsubscribe());
    this.subscriptions.delete(chatId);
  }

  private unsubscribeAll(): void {
    for (const chatId of this.subscriptions.keys()) {
      this.unsubscribeChat(chatId);
    }
  }
}
