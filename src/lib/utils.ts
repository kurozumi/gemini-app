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
 * ユーザーIDを取得または生成する（localStorageで永続化）
 */
export function getPersistentUserId(): string {
  if (typeof window === 'undefined') return generateUserId();
  
  const storedId = localStorage.getItem('koetoba_user_id');
  if (storedId) return storedId;
  
  const newId = generateUserId();
  localStorage.setItem('koetoba_user_id', newId);
  return newId;
}

/**
 * IDに役割を付加する
 */
export function formatIdentity(username: string, role: string): string {
  return `${username}-${role}`;
}
