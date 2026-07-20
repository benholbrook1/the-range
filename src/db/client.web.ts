import {
  createMemoryStore,
  type AppStore,
} from '@/src/db/memoryStore';

let singleton: AppStore | null = null;

/** Web: in-memory store only (expo-sqlite WASM is not available in Metro web). */
export async function getAppStore(): Promise<AppStore> {
  if (!singleton) {
    singleton = createMemoryStore();
  }
  return singleton;
}

export function setAppStoreForTests(store: AppStore | null) {
  singleton = store;
}
