import {
  parseDrillPack,
  safeParseDrillPack,
} from '@/src/domain/packSchema';
import coreStarter from '@/src/assets/drills/core-starter-v1.json';

describe('packSchema', () => {
  it('accepts the bundled starter pack', () => {
    const pack = parseDrillPack(coreStarter);
    expect(pack.packId).toBe('core-starter-v1');
    expect(pack.drills.length).toBeGreaterThan(0);
  });

  it('rejects wrong schemaVersion', () => {
    const result = safeParseDrillPack({
      ...coreStarter,
      schemaVersion: 99,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/schemaVersion/i);
    }
  });

  it('rejects malformed payload', () => {
    const result = safeParseDrillPack({ schemaVersion: 1, drills: [] });
    expect(result.ok).toBe(false);
  });
});
