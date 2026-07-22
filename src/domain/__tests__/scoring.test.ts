import {
  summarizeAttempts,
  createAttemptPayload,
  describeScoring,
  isLowerBetter,
  targetAttemptCount,
} from '@/src/domain/scoring';
import type { ScoringConfig } from '@/src/domain/types';

describe('summarizeAttempts', () => {
  const makes: ScoringConfig = {
    type: 'makes_out_of',
    attempts: 10,
    unit: 'putts',
  };

  it('handles empty attempts', () => {
    const summary = summarizeAttempts(makes, []);
    expect(summary.value).toBe(0);
    expect(summary.label).toBe('0/10');
  });

  it('counts makes and misses', () => {
    const summary = summarizeAttempts(makes, [
      { payload: { type: 'makes_out_of', made: true } },
      { payload: { type: 'makes_out_of', made: false } },
      { payload: { type: 'makes_out_of', made: true } },
    ]);
    expect(summary.value).toBe(2);
    expect(summary.label).toBe('2/10');
  });

  it('perfect score', () => {
    const attempts = Array.from({ length: 10 }, () => ({
      payload: { type: 'makes_out_of' as const, made: true },
    }));
    expect(summarizeAttempts(makes, attempts).value).toBe(10);
  });

  it('all miss', () => {
    const attempts = Array.from({ length: 10 }, () => ({
      payload: { type: 'makes_out_of' as const, made: false },
    }));
    expect(summarizeAttempts(makes, attempts).value).toBe(0);
  });

  it('sums reps', () => {
    const scoring: ScoringConfig = {
      type: 'reps',
      target: 20,
      unit: 'swings',
    };
    const summary = summarizeAttempts(scoring, [
      { payload: { type: 'reps', count: 5 } },
      { payload: { type: 'reps', count: 7 } },
    ]);
    expect(summary.value).toBe(12);
    expect(summary.label).toBe('12/20');
  });

  it('sums score_total', () => {
    const scoring: ScoringConfig = { type: 'score_total', unit: 'points' };
    const summary = summarizeAttempts(scoring, [
      { payload: { type: 'score_total', points: 3 } },
      { payload: { type: 'score_total', points: 4 } },
    ]);
    expect(summary.value).toBe(7);
    expect(summary.label).toBe('7');
  });

  it('tracks strokes vs par', () => {
    const scoring: ScoringConfig = {
      type: 'strokes',
      holes: 18,
      parPerHole: 2,
      unit: 'strokes',
    };
    const summary = summarizeAttempts(scoring, [
      { payload: { type: 'strokes', strokes: 1 } },
      { payload: { type: 'strokes', strokes: 2 } },
      { payload: { type: 'strokes', strokes: 3 } },
    ]);
    expect(summary.value).toBe(6);
    expect(summary.label).toBe('6 (E)');
  });

  it('shows under par for strokes', () => {
    const scoring: ScoringConfig = {
      type: 'strokes',
      holes: 18,
      parPerHole: 2,
      unit: 'strokes',
    };
    const summary = summarizeAttempts(scoring, [
      { payload: { type: 'strokes', strokes: 1 } },
      { payload: { type: 'strokes', strokes: 1 } },
    ]);
    expect(summary.label).toBe('2 (-2)');
  });
});

describe('createAttemptPayload', () => {
  it('creates payloads for each scoring type', () => {
    expect(
      createAttemptPayload(
        { type: 'makes_out_of', attempts: 5, unit: 'x' },
        { made: true },
      ),
    ).toEqual({ type: 'makes_out_of', made: true });
    expect(
      createAttemptPayload({ type: 'reps', unit: 'x' }, { count: 3 }),
    ).toEqual({ type: 'reps', count: 3 });
    expect(
      createAttemptPayload({ type: 'score_total', unit: 'x' }, { points: 2 }),
    ).toEqual({ type: 'score_total', points: 2 });
    expect(
      createAttemptPayload(
        { type: 'strokes', holes: 18, parPerHole: 2, unit: 'strokes' },
        { strokes: 2 },
      ),
    ).toEqual({ type: 'strokes', strokes: 2 });
  });
});

describe('scoring helpers', () => {
  it('marks strokes as lower-better', () => {
    expect(
      isLowerBetter({
        type: 'strokes',
        holes: 18,
        parPerHole: 2,
        unit: 'strokes',
      }),
    ).toBe(true);
    expect(
      isLowerBetter({ type: 'makes_out_of', attempts: 10, unit: 'putts' }),
    ).toBe(false);
  });

  it('resolves target attempt counts', () => {
    expect(
      targetAttemptCount({
        type: 'strokes',
        holes: 18,
        parPerHole: 2,
        unit: 'strokes',
      }),
    ).toBe(18);
    expect(
      targetAttemptCount({
        type: 'score_total',
        unit: 'points',
        attempts: 10,
      }),
    ).toBe(10);
  });

  it('describes strokes scoring', () => {
    expect(
      describeScoring({
        type: 'strokes',
        holes: 18,
        parPerHole: 2,
        unit: 'strokes',
      }),
    ).toMatch(/Lower is better/);
  });
});
