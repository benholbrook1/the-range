import {
  createMemoryStore,
  type AppStore,
} from '@/src/db/memoryStore';

let singleton: AppStore | null = null;

/** Native: SQLite via expo-sqlite, with in-memory fallback. */
export async function getAppStore(): Promise<AppStore> {
  if (!singleton) {
    try {
      const { openSqliteStore } = await import('@/src/db/sqliteStore');
      singleton = await openSqliteStore();
    } catch (error) {
      console.warn(
        'SQLite unavailable, using in-memory store',
        error instanceof Error ? error.message : error,
      );
      singleton = createMemoryStore();
    }
  }
  return singleton;
}

export function setAppStoreForTests(store: AppStore | null) {
  singleton = store;
}
