import { Platform } from 'react-native';

import {
  createMemoryStore,
  type AppStore,
} from '@/src/db/memoryStore';

let singleton: AppStore | null = null;

/**
 * Native (iOS/Android): SQLite via expo-sqlite.
 * Web: in-memory store (expo-sqlite WASM does not bundle cleanly for static web).
 */
export async function getAppStore(): Promise<AppStore> {
  if (!singleton) {
    if (Platform.OS === 'web') {
      singleton = createMemoryStore();
    } else {
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
  }
  return singleton;
}

export function setAppStoreForTests(store: AppStore | null) {
  singleton = store;
}
