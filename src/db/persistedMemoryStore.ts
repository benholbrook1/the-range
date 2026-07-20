import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createMemoryStore,
  type AppStore,
  type StoreSnapshot,
} from '@/src/db/memoryStore';

const STORAGE_KEY = 'the-range.store.v1';

export async function createPersistedMemoryStore(): Promise<AppStore> {
  let initial: Partial<StoreSnapshot> | undefined;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      initial = JSON.parse(raw) as StoreSnapshot;
    }
  } catch {
    initial = undefined;
  }

  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  return createMemoryStore(initial, (snapshot) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    }, 150);
  });
}
