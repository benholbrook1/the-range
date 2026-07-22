import coreStarter from '@/src/assets/drills/core-starter-v1.json';
import type { AppStore } from '@/src/db/memoryStore';
import { installPackPayload } from '@/src/services/packs';

/** Always upsert the bundled pack so starter drills stay current. */
export async function bootstrapApp(store: AppStore): Promise<void> {
  await installPackPayload(store, coreStarter, 'bundled');
}

export async function clearAllAndReseed(store: AppStore): Promise<void> {
  await store.clearUserData();
  await installPackPayload(store, coreStarter, 'bundled');
}
