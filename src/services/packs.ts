import type { AppStore } from '@/src/db/memoryStore';
import type { Drill, Pack } from '@/src/domain/types';
import {
  parseDrillPack,
  safeParseDrillPack,
  type DrillPackInput,
} from '@/src/domain/packSchema';

function toDrills(pack: DrillPackInput): Drill[] {
  return pack.drills.map((d) => ({
    id: d.id,
    packId: pack.packId,
    name: d.name,
    category: d.category,
    estimatedMinutes: d.estimatedMinutes,
    instructions: d.instructions,
    scoring: d.scoring,
  }));
}

export async function installPackPayload(
  store: AppStore,
  raw: unknown,
  source: Pack['source'],
): Promise<{ pack: Pack; drillCount: number }> {
  const packInput = parseDrillPack(raw);
  const installedAt = new Date().toISOString();
  const pack: Pack = {
    id: packInput.packId,
    name: packInput.name,
    schemaVersion: packInput.schemaVersion,
    source,
    installedAt,
  };
  const drills = toDrills(packInput);

  await store.upsertPack(pack);
  await store.replaceDrillsForPack(pack.id, drills);
  return { pack, drillCount: drills.length };
}

export async function tryInstallPackPayload(
  store: AppStore,
  raw: unknown,
  source: Pack['source'],
): Promise<
  | { ok: true; pack: Pack; drillCount: number }
  | { ok: false; error: string }
> {
  const parsed = safeParseDrillPack(raw);
  if (!parsed.ok) return parsed;
  try {
    const result = await installPackPayload(store, parsed.pack, source);
    return { ok: true, ...result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to install pack',
    };
  }
}

export async function listInstalledPacks(store: AppStore): Promise<Pack[]> {
  return store.listPacks();
}

export async function uninstallPack(
  store: AppStore,
  packId: string,
): Promise<void> {
  const pack = await store.getPack(packId);
  if (!pack) throw new Error('Pack not found');
  await store.removePack(packId);
}
