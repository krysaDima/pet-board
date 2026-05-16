/**
 * Стабильный id личного чата между двумя пользователями (порядок id не важен).
 */
export function makeDmChatId(userIdA: string, userIdB: string): string {
  return `dm-${[userIdA, userIdB].sort().join('-')}`;
}
