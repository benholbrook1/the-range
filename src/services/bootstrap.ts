import coreStarter from '@/src/assets/drills/core-starter-v1.json';
import type { AppStore } from '@/src/db/memoryStore';
import { installPackPayload } from '@/src/services/packs';

export async function bootstrapApp(store: AppStore): Promise<void> {
  const packs = await store.listPacks();
  if (packs.length === 0) {
    await installPackPayload(store, coreStarter, 'bundled');
  }
}

export async function clearAllAndReseed(store: AppStore): Promise<void> {
  await store.clearUserData();
  await installPackPayload(store, coreStarter, 'bundled');
}
