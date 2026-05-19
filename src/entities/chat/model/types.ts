/** Статус доставки сообщения */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export type Message = {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
  /** Статус доставки */
  status: MessageStatus;
  /** Отредактировано ли сообщение */
  isEdited?: boolean;
  /** Время редактирования */
  editedAt?: string;
  /** ID сообщения, на которое это ответ */
  replyToId?: string;
};

export type ChatThread = {
  id: string;
  participantIds: string[];
  /** Объявление, по которому начат диалог (если есть). */
  listingId?: string | null;
  messages: Message[];
  /** Количество непрочитанных сообщений */
  unreadCount?: number;
  /** Статус набора текста собеседником */
  isTyping?: boolean;
  /** Последнее время активности */
  lastActivityAt?: string;
  /** Скрыт из списка после очистки до нового сообщения */
  hiddenFromList?: boolean;
};

/** Информация о печатающем пользователе */
export type TypingStatus = {
  chatId: string;
  userId: string;
  isTyping: boolean;
};
