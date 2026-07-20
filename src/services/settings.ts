import type { AppStore } from '@/src/db/memoryStore';
import type { DistanceUnits, Settings } from '@/src/domain/types';

export async function getSettings(store: AppStore): Promise<Settings> {
  return store.getSettings();
}

export async function setDisplayName(
  store: AppStore,
  name: string,
): Promise<Settings> {
  return store.updateSettings({ displayName: name.trim() });
}

export async function setUnits(
  store: AppStore,
  units: DistanceUnits,
): Promise<Settings> {
  return store.updateSettings({ units });
}
