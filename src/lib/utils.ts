/**
 * テスト可能なユーティリティ関数
 */

/**
 * ユーザーIDを生成する（crypto.randomUUIDのフォールバック付き）
 */
export function generateUserId(): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  return `user-${uuid}`;
}

/**
 * IDに役割を付加する
 */
export function formatIdentity(username: string, role: string): string {
  return `${username}-${role}`;
}
