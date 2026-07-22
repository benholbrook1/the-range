import {
  buildHandicapSnapshot,
  computeAreaIndex,
  computeDifferential,
  differentialsUsed,
  formatDifferential,
  formatHandicap,
} from '@/src/domain/handicap';

describe('computeDifferential', () => {
  it('maps perfect makes to 0', () => {
    expect(
      computeDifferential(
        { type: 'makes_out_of', attempts: 10, unit: 'putts' },
        10,
        10,
      ),
    ).toBe(0);
  });

  it('maps half makes to 18', () => {
    expect(
      computeDifferential(
        { type: 'makes_out_of', attempts: 10, unit: 'putts' },
        5,
        10,
      ),
    ).toBe(18);
  });

  it('maps strokes to to-par', () => {
    expect(
      computeDifferential(
        { type: 'strokes', holes: 18, parPerHole: 2, unit: 'strokes' },
        36,
        18,
      ),
    ).toBe(0);
    expect(
      computeDifferential(
        { type: 'strokes', holes: 18, parPerHole: 2, unit: 'strokes' },
        40,
        18,
      ),
    ).toBe(4);
    expect(
      computeDifferential(
        { type: 'strokes', holes: 18, parPerHole: 2, unit: 'strokes' },
        32,
        18,
      ),
    ).toBe(-4);
  });

  it('maps score_total against max points', () => {
    expect(
      computeDifferential(
        { type: 'score_total', unit: 'points', attempts: 10 },
        30,
        10,
      ),
    ).toBe(0);
    expect(
      computeDifferential(
        { type: 'score_total', unit: 'points', attempts: 10 },
        15,
        10,
      ),
    ).toBe(18);
  });

  it('returns null with no attempts', () => {
    expect(
      computeDifferential(
        { type: 'makes_out_of', attempts: 10, unit: 'putts' },
        0,
        0,
      ),
    ).toBeNull();
  });
});

describe('computeAreaIndex', () => {
  it('returns null for empty', () => {
    expect(computeAreaIndex([])).toBeNull();
  });

  it('uses best differentials like a sliding WHS-style sample', () => {
    expect(differentialsUsed(1)).toBe(1);
    expect(differentialsUsed(8)).toBe(4);
    expect(differentialsUsed(20)).toBe(8);

    // Best 4 of these 8 → 1,2,3,4 avg = 2.5
    const index = computeAreaIndex([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(index).toBe(2.5);
  });
});

describe('formatting', () => {
  it('formats plus handicaps and differentials', () => {
    expect(formatHandicap(-1.2)).toBe('+1.2');
    expect(formatHandicap(8.4)).toBe('8.4');
    expect(formatDifferential(4)).toBe('+4.0');
    expect(formatDifferential(-2)).toBe('-2.0');
    expect(formatDifferential(0)).toBe('E');
  });
});

describe('buildHandicapSnapshot', () => {
  it('builds area board and overall average', () => {
    const snap = buildHandicapSnapshot({
      putting: [10, 12],
      short_game: [4],
      full_swing: [],
    });
    expect(snap.areas).toHaveLength(3);
    expect(snap.areas.find((a) => a.category === 'putting')?.index).toBe(10);
    expect(snap.areas.find((a) => a.category === 'full_swing')?.index).toBeNull();
    expect(snap.overall).toBe(7); // (10 + 4) / 2
  });
});
