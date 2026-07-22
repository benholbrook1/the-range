import {
  parseDrillPack,
  safeParseDrillPack,
} from '@/src/domain/packSchema';
import coreStarter from '@/src/assets/drills/core-starter-v1.json';

describe('packSchema', () => {
  it('accepts the bundled starter pack', () => {
    const pack = parseDrillPack(coreStarter);
    expect(pack.packId).toBe('core-starter-v1');
    expect(pack.name).toBe('Practice Games');
    expect(pack.drills.length).toBeGreaterThanOrEqual(8);
    expect(pack.drills.every((d) => d.visual)).toBe(true);
    const par18 = pack.drills.find((d) => d.id === 'par-18');
    expect(par18?.scoring).toEqual({
      type: 'strokes',
      holes: 18,
      parPerHole: 2,
      unit: 'strokes',
    });
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
