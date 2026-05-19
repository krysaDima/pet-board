import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { blockUserApi, fetchBlockedUsers, unblockUserApi } from '@/api/userBlockApi';
import { useAuth } from '@/app/auth/AuthContext';

type BlockedUsersContextValue = {
  blockedByMe: Set<string>;
  blockedMe: Set<string>;
  isBlockedByMe: (userId: string) => boolean;
  isUserHidden: (userId: string) => boolean;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  refreshBlockedUsers: () => Promise<void>;
};

const BlockedUsersContext = createContext<BlockedUsersContextValue | null>(null);

/** Состояние блокировок пользователей для чатов и профилей. */
export function BlockedUsersProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [blockedByMe, setBlockedByMe] = useState<Set<string>>(new Set());
  const [blockedMe, setBlockedMe] = useState<Set<string>>(new Set());

  const refreshBlockedUsers = useCallback(async () => {
    if (!userId) {
      setBlockedByMe(new Set());
      setBlockedMe(new Set());
      return;
    }
    const data = await fetchBlockedUsers();
    setBlockedByMe(new Set(data.blockedByMe));
    setBlockedMe(new Set(data.blockedMe));
  }, [userId]);

  useEffect(() => {
    void refreshBlockedUsers();
  }, [refreshBlockedUsers]);

  const isBlockedByMe = useCallback((id: string) => blockedByMe.has(id), [blockedByMe]);

  const isUserHidden = useCallback(
    (id: string) => blockedByMe.has(id) || blockedMe.has(id),
    [blockedByMe, blockedMe],
  );

  const blockUser = useCallback(
    async (targetUserId: string) => {
      await blockUserApi(targetUserId);
      setBlockedByMe((prev) => new Set([...prev, targetUserId]));
    },
    [],
  );

  const unblockUser = useCallback(async (targetUserId: string) => {
    await unblockUserApi(targetUserId);
    setBlockedByMe((prev) => {
      const next = new Set(prev);
      next.delete(targetUserId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      blockedByMe,
      blockedMe,
      isBlockedByMe,
      isUserHidden,
      blockUser,
      unblockUser,
      refreshBlockedUsers,
    }),
    [blockedByMe, blockedMe, isBlockedByMe, isUserHidden, blockUser, unblockUser, refreshBlockedUsers],
  );

  return <BlockedUsersContext.Provider value={value}>{children}</BlockedUsersContext.Provider>;
}

export function useBlockedUsers() {
  const ctx = useContext(BlockedUsersContext);
  if (!ctx) {
    throw new Error('useBlockedUsers must be used within BlockedUsersProvider');
  }
  return ctx;
}
