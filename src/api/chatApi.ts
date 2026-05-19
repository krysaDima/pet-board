import type { ChatThread, Message, MessageStatus } from '@/entities/chat/model/types';
import { apiGet, apiPost } from '@/api/client';
import { isApiMocksMode } from '@/api/listingsApi';

/** DTO сообщения с бэкенда. */
export type MessageDto = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  read: boolean;
  sentAt: string;
};

/** DTO краткого описания чата. */
export type ChatSummaryDto = {
  id: string;
  participantIds: string[];
  otherParticipant: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  listingId: string | null;
  lastMessage: MessageDto | null;
  unreadCount: number;
  lastActivityAt: string;
};

type PageDto<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export function mapMessageDto(dto: MessageDto, viewerId: string): Message {
  const mine = dto.senderId === viewerId;
  let status: MessageStatus = mine ? 'sent' : 'delivered';
  if (dto.read) {
    status = 'read';
  }
  return {
    id: dto.id,
    senderId: dto.senderId,
    body: dto.content,
    sentAt: dto.sentAt,
    status,
  };
}

export function mapSummaryToThread(summary: ChatSummaryDto, viewerId: string): ChatThread {
  return {
    id: summary.id,
    participantIds: summary.participantIds,
    listingId: summary.listingId,
    unreadCount: summary.unreadCount,
    lastActivityAt: summary.lastActivityAt,
    messages: summary.lastMessage ? [mapMessageDto(summary.lastMessage, viewerId)] : [],
  };
}

/** Список чатов текущего пользователя. */
export async function fetchMyChats(): Promise<ChatSummaryDto[]> {
  return apiGet<ChatSummaryDto[]>('/me/chats');
}

/** Информация о чате по id. */
export async function fetchChatById(chatId: string): Promise<ChatSummaryDto> {
  return apiGet<ChatSummaryDto>(`/chats/${chatId}`);
}

/** Создать или получить диалог. */
export async function createOrGetChat(body: {
  otherUserId: string;
  listingId?: string;
}): Promise<ChatSummaryDto> {
  return apiPost<ChatSummaryDto>('/chats', body);
}

/** Сообщения чата (до 200 последних на первой странице). */
export async function fetchChatMessages(chatId: string): Promise<MessageDto[]> {
  const page = await apiGet<PageDto<MessageDto>>(`/chats/${chatId}/messages?page=0&size=200`);
  return page.content ?? [];
}

/** Отправить сообщение. */
export async function postChatMessage(chatId: string, content: string): Promise<MessageDto> {
  return apiPost<MessageDto>(`/chats/${chatId}/messages`, { content });
}

/** Отметить чат прочитанным. */
export async function markChatRead(chatId: string): Promise<void> {
  await apiPost<void>(`/chats/${chatId}/read`, {});
}

/** Очистить историю чата только у текущего пользователя. */
export async function clearChatHistory(chatId: string): Promise<void> {
  await apiPost<void>(`/chats/${chatId}/clear`, {});
}

export function isChatApiEnabled(): boolean {
  return !isApiMocksMode();
}
