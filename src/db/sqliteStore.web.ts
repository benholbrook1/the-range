/**
 * Web stub — Metro must not load expo-sqlite on web.
 * Native implementation lives in sqliteStore.ts.
 */
export async function openSqliteStore(): Promise<never> {
  throw new Error('SQLite is not available on web');
}

export function createSqliteStore(): never {
  throw new Error('SQLite is not available on web');
}
