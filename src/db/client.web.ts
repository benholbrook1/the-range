import {
  createMemoryStore,
  type AppStore,
} from '@/src/db/memoryStore';

let singleton: AppStore | null = null;

/** Web: AsyncStorage-backed memory store (no expo-sqlite). */
export async function getAppStore(): Promise<AppStore> {
  if (!singleton) {
    const { createPersistedMemoryStore } = await import(
      '@/src/db/persistedMemoryStore'
    );
    singleton = await createPersistedMemoryStore();
  }
  return singleton;
}

export function setAppStoreForTests(store: AppStore | null) {
  singleton = store;
}

// Keep createMemoryStore available for tests via this module if needed
export { createMemoryStore };
