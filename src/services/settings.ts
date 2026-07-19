import type { AppStore } from '@/src/db/memoryStore';
import type { Settings } from '@/src/domain/types';

export async function getSettings(store: AppStore): Promise<Settings> {
  return store.getSettings();
}

export async function setDisplayName(
  store: AppStore,
  name: string,
): Promise<Settings> {
  return store.setDisplayName(name.trim());
}
