import { apiDelete, apiGet, apiPut, getStoredSession } from '@/api/client';
import { isApiMocksMode } from '@/api/listingsApi';

export type BlockedUsersDto = {
  blockedByMe: string[];
  blockedMe: string[];
};

const MOCK_STORAGE_PREFIX = 'pet-board-blocked-by-me:';

function mockKey(userId: string): string {
  return `${MOCK_STORAGE_PREFIX}${userId}`;
}

function loadMockBlocked(userId: string): BlockedUsersDto {
  try {
    const raw = localStorage.getItem(mockKey(userId));
    const blockedByMe: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return { blockedByMe, blockedMe: [] };
  } catch {
    return { blockedByMe: [], blockedMe: [] };
  }
}

function saveMockBlocked(userId: string, blockedByMe: string[]): void {
  localStorage.setItem(mockKey(userId), JSON.stringify(blockedByMe));
}

/** Списки блокировок текущего пользователя. */
export async function fetchBlockedUsers(): Promise<BlockedUsersDto> {
  const session = getStoredSession();
  if (!session?.userId) {
    return { blockedByMe: [], blockedMe: [] };
  }
  if (isApiMocksMode()) {
    return loadMockBlocked(session.userId);
  }
  return apiGet<BlockedUsersDto>('/me/blocked-users');
}

/** Заблокировать пользователя. */
export async function blockUserApi(targetUserId: string): Promise<void> {
  const session = getStoredSession();
  if (!session?.userId) return;

  if (isApiMocksMode()) {
    const data = loadMockBlocked(session.userId);
    if (!data.blockedByMe.includes(targetUserId)) {
      saveMockBlocked(session.userId, [...data.blockedByMe, targetUserId]);
    }
    return;
  }
  await apiPut<void>(`/me/blocked-users/${targetUserId}`, {});
}

/** Разблокировать пользователя. */
export async function unblockUserApi(targetUserId: string): Promise<void> {
  const session = getStoredSession();
  if (!session?.userId) return;

  if (isApiMocksMode()) {
    const data = loadMockBlocked(session.userId);
    saveMockBlocked(
      session.userId,
      data.blockedByMe.filter((id) => id !== targetUserId),
    );
    return;
  }
  await apiDelete<void>(`/me/blocked-users/${targetUserId}`);
}
