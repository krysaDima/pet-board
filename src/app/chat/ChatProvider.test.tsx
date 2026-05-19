import { describe, it, expect } from 'vitest';
import { sanitizeMessage, isSpamLike, maskSensitiveData } from '@/shared/lib/sanitize';
import type { Message, MessageStatus, ChatThread } from '@/entities/chat/model/types';

describe('Chat Types', () => {
  it('должен иметь корректную структуру Message', () => {
    const message: Message = {
      id: 'msg-1',
      senderId: 'user-1',
      body: 'Привет!',
      sentAt: new Date().toISOString(),
      status: 'sent' as MessageStatus,
    };

    expect(message.id).toBeDefined();
    expect(message.senderId).toBeDefined();
    expect(message.body).toBe('Привет!');
    expect(message.status).toBe('sent');
  });

  it('должен поддерживать все статусы сообщений', () => {
    const statuses: MessageStatus[] = ['sending', 'sent', 'delivered', 'read', 'error'];
    
    statuses.forEach((status) => {
      const msg: Message = {
        id: '1',
        senderId: 'u1',
        body: 'test',
        sentAt: new Date().toISOString(),
        status,
      };
      expect(msg.status).toBe(status);
    });
  });

  it('должен поддерживать поле replyToId', () => {
    const replyMessage: Message = {
      id: 'msg-2',
      senderId: 'user-1',
      body: 'Это ответ',
      sentAt: new Date().toISOString(),
      status: 'sent',
      replyToId: 'msg-1',
    };

    expect(replyMessage.replyToId).toBe('msg-1');
  });

  it('должен поддерживать isEdited', () => {
    const editedMessage: Message = {
      id: 'msg-3',
      senderId: 'user-1',
      body: 'Отредактировано',
      sentAt: new Date().toISOString(),
      status: 'sent',
      isEdited: true,
      editedAt: new Date().toISOString(),
    };

    expect(editedMessage.isEdited).toBe(true);
    expect(editedMessage.editedAt).toBeDefined();
  });
});

describe('ChatThread Type', () => {
  it('должен иметь корректную структуру ChatThread', () => {
    const thread: ChatThread = {
      id: 'chat-1',
      participantIds: ['user-1', 'user-2'],
      messages: [],
      unreadCount: 0,
      lastActivityAt: new Date().toISOString(),
    };

    expect(thread.id).toBeDefined();
    expect(thread.participantIds).toHaveLength(2);
    expect(thread.messages).toEqual([]);
    expect(thread.unreadCount).toBe(0);
  });

  it('должен поддерживать isTyping', () => {
    const thread: ChatThread = {
      id: 'chat-1',
      participantIds: ['user-1', 'user-2'],
      messages: [],
      isTyping: true,
    };

    expect(thread.isTyping).toBe(true);
  });
});

describe('Chat Security', () => {
  it('должен санитизировать XSS в сообщениях', () => {
    const malicious = '<script>alert("xss")</script>Текст';
    const sanitized = sanitizeMessage(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('Текст');
  });

  it('должен удалять javascript: протокол', () => {
    const malicious = 'click javascript:alert(1)';
    const sanitized = sanitizeMessage(malicious);
    expect(sanitized).not.toContain('javascript:');
  });

  it('должен удалять обработчики событий', () => {
    const malicious = '<img onerror=alert(1) src="">';
    const sanitized = sanitizeMessage(malicious);
    expect(sanitized).not.toContain('onerror');
  });

  it('должен определять спам', () => {
    expect(isSpamLike('aaaaaaaaaaaaaaaaaaa')).toBe(true);
    expect(isSpamLike('Привет!')).toBe(false);
  });

  it('должен маскировать личные данные', () => {
    const text = 'Мой телефон: +7 999 123-45-67';
    expect(maskSensitiveData(text)).toContain('[телефон скрыт]');
  });
});

describe('Message Limits', () => {
  it('должен ограничивать длину сообщения', () => {
    const longMessage = 'a'.repeat(3000);
    const sanitized = sanitizeMessage(longMessage);
    expect(sanitized.length).toBeLessThanOrEqual(2000);
  });

  it('должен обрезать пустые сообщения', () => {
    expect(sanitizeMessage('')).toBe('');
    expect(sanitizeMessage('   ')).toBe('');
  });

  it('должен нормализовать переносы строк', () => {
    const text = 'line1\n\n\n\nline2';
    const sanitized = sanitizeMessage(text);
    expect(sanitized).toBe('line1\n\nline2');
  });
});
