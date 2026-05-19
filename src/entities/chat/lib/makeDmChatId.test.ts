import { describe, expect, it } from 'vitest';
import { makeDmChatId, parseDmChatId } from '@/entities/chat/lib/makeDmChatId';

const USER_A = '550e8400-e29b-41d4-a716-446655440000';
const USER_B = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('makeDmChatId', () => {
  it('даёт один id независимо от порядка участников', () => {
    expect(makeDmChatId(USER_A, USER_B)).toBe(makeDmChatId(USER_B, USER_A));
  });

  it('parseDmChatId восстанавливает участников', () => {
    const chatId = makeDmChatId(USER_A, USER_B);
    expect(parseDmChatId(chatId)).toEqual([USER_A, USER_B].sort());
  });

  it('отклоняет некорректный id', () => {
    expect(parseDmChatId('room-123')).toBeNull();
    expect(parseDmChatId('dm-not-a-uuid')).toBeNull();
  });
});
