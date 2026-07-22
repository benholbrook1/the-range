import type { DrillCategory, ScoringConfig } from './types';

/** Areas that carry a Range handicap (excludes generic "other"). */
export const HANDICAP_AREAS: DrillCategory[] = [
  'putting',
  'short_game',
  'full_swing',
];

export const HANDICAP_WINDOW = 20;
export const HANDICAP_BEST_CAP = 8;

export type AreaHandicap = {
  category: DrillCategory;
  /** Null when no qualifying rounds yet. */
  index: number | null;
  rounds: number;
  usedCount: number;
};

export type HandicapSnapshot = {
  areas: AreaHandicap[];
  /** Average of rated area indices; null if none rated. */
  overall: number | null;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Convert a completed game into a golf-like differential (lower is better).
 * Rough band: scratch ≈ 0 (or plus), mid ≈ 18, rough day ≈ 36+.
 */
export function computeDifferential(
  scoring: ScoringConfig,
  summaryValue: number,
  attemptCount: number,
): number | null {
  if (attemptCount <= 0) return null;

  if (scoring.type === 'makes_out_of') {
    const outOf = scoring.attempts;
    if (outOf <= 0) return null;
    const makes = clamp(summaryValue, 0, outOf);
    return round1((1 - makes / outOf) * 36);
  }

  if (scoring.type === 'strokes') {
    const expectedPar = attemptCount * scoring.parPerHole;
    return round1(clamp(summaryValue - expectedPar, -10, 54));
  }

  if (scoring.type === 'score_total') {
    const shots = scoring.attempts ?? attemptCount;
    const maxPoints = shots * 3; // ring / zone convention
    if (maxPoints <= 0) return null;
    const points = clamp(summaryValue, 0, maxPoints);
    return round1((1 - points / maxPoints) * 36);
  }

  if (scoring.type === 'reps') {
    const target = scoring.target ?? attemptCount;
    if (target <= 0) return null;
    const reps = clamp(summaryValue, 0, target);
    return round1((1 - reps / target) * 36);
  }

  return null;
}

/** How many lowest differentials to average, given rounds posted. */
export function differentialsUsed(roundCount: number): number {
  if (roundCount <= 0) return 0;
  if (roundCount === 1) return 1;
  if (roundCount === 2) return 1;
  if (roundCount <= 5) return 2;
  if (roundCount <= 7) return 3;
  if (roundCount <= 9) return 4;
  if (roundCount <= 11) return 5;
  if (roundCount <= 14) return 6;
  if (roundCount <= 16) return 7;
  return HANDICAP_BEST_CAP;
}

export function computeAreaIndex(differentials: number[]): number | null {
  if (differentials.length === 0) return null;
  const recent = differentials.slice(0, HANDICAP_WINDOW);
  const use = differentialsUsed(recent.length);
  const best = [...recent].sort((a, b) => a - b).slice(0, use);
  const avg = best.reduce((sum, n) => sum + n, 0) / best.length;
  return round1(avg);
}

export function formatHandicap(index: number): string {
  if (index < 0) return `+${(-index).toFixed(1)}`;
  return index.toFixed(1);
}

export function formatDifferential(diff: number): string {
  if (diff > 0) return `+${diff.toFixed(1)}`;
  if (diff < 0) return diff.toFixed(1);
  return 'E';
}

export function isHandicapArea(category: DrillCategory): boolean {
  return HANDICAP_AREAS.includes(category);
}

export function buildHandicapSnapshot(
  byCategory: Partial<Record<DrillCategory, number[]>>,
): HandicapSnapshot {
  const areas: AreaHandicap[] = HANDICAP_AREAS.map((category) => {
    const diffs = byCategory[category] ?? [];
    return {
      category,
      index: computeAreaIndex(diffs),
      rounds: diffs.length,
      usedCount: differentialsUsed(diffs.length),
    };
  });

  const rated = areas.filter((a) => a.index != null) as Array<
    AreaHandicap & { index: number }
  >;
  const overall =
    rated.length === 0
      ? null
      : round1(rated.reduce((sum, a) => sum + a.index, 0) / rated.length);

  return { areas, overall };
}
