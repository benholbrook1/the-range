import type { Attempt, AttemptPayload, ScoringConfig } from './types';

export type ScoreSummary = {
  label: string;
  value: number;
  detail: string;
};

function formatToPar(toPar: number): string {
  if (toPar === 0) return 'E';
  if (toPar > 0) return `+${toPar}`;
  return String(toPar);
}

export function summarizeAttempts(
  scoring: ScoringConfig,
  attempts: Pick<Attempt, 'payload'>[],
): ScoreSummary {
  if (scoring.type === 'makes_out_of') {
    const makes = attempts.filter(
      (a) => a.payload.type === 'makes_out_of' && a.payload.made,
    ).length;
    const taken = attempts.filter((a) => a.payload.type === 'makes_out_of').length;
    const outOf = scoring.attempts;
    return {
      label: `${makes}/${outOf}`,
      value: makes,
      detail: `${makes} makes out of ${outOf} ${scoring.unit} (${taken} logged)`,
    };
  }

  if (scoring.type === 'reps') {
    const total = attempts.reduce((sum, a) => {
      if (a.payload.type === 'reps') return sum + a.payload.count;
      return sum;
    }, 0);
    const target = scoring.target;
    return {
      label: target != null ? `${total}/${target}` : String(total),
      value: total,
      detail:
        target != null
          ? `${total} ${scoring.unit} (target ${target})`
          : `${total} ${scoring.unit}`,
    };
  }

  if (scoring.type === 'strokes') {
    const total = attempts.reduce((sum, a) => {
      if (a.payload.type === 'strokes') return sum + a.payload.strokes;
      return sum;
    }, 0);
    const holes = scoring.holes;
    const taken = attempts.filter((a) => a.payload.type === 'strokes').length;
    const par = holes * scoring.parPerHole;
    const toPar = total - (taken * scoring.parPerHole);
    const runningLabel =
      taken === 0 ? `0 (E)` : `${total} (${formatToPar(toPar)})`;
    return {
      label: runningLabel,
      value: total,
      detail:
        taken >= holes
          ? `${total} ${scoring.unit} · par ${par} · ${formatToPar(total - par)}`
          : `${total} ${scoring.unit} through ${taken}/${holes} · ${formatToPar(toPar)}`,
    };
  }

  const total = attempts.reduce((sum, a) => {
    if (a.payload.type === 'score_total') return sum + a.payload.points;
    return sum;
  }, 0);
  const attemptCap = scoring.attempts;
  return {
    label: String(total),
    value: total,
    detail:
      attemptCap != null
        ? `${total} ${scoring.unit} (${attempts.length}/${attemptCap} logged)`
        : `${total} ${scoring.unit}`,
  };
}

export function createAttemptPayload(
  scoring: ScoringConfig,
  input: { made?: boolean; count?: number; points?: number; strokes?: number },
): AttemptPayload {
  if (scoring.type === 'makes_out_of') {
    return { type: 'makes_out_of', made: Boolean(input.made) };
  }
  if (scoring.type === 'reps') {
    return { type: 'reps', count: Math.max(0, Number(input.count ?? 0)) };
  }
  if (scoring.type === 'strokes') {
    return {
      type: 'strokes',
      strokes: Math.max(1, Number(input.strokes ?? 1)),
    };
  }
  return { type: 'score_total', points: Number(input.points ?? 0) };
}

export function describeScoring(scoring: ScoringConfig): string {
  if (scoring.type === 'makes_out_of') {
    return `Make as many as you can out of ${scoring.attempts} ${scoring.unit}.`;
  }
  if (scoring.type === 'reps') {
    return scoring.target != null
      ? `Complete ${scoring.target} ${scoring.unit}.`
      : `Log your ${scoring.unit}.`;
  }
  if (scoring.type === 'strokes') {
    const par = scoring.holes * scoring.parPerHole;
    return `Log strokes for ${scoring.holes} balls. Par is ${scoring.parPerHole} each (${par} total). Lower is better.`;
  }
  if (scoring.attempts != null) {
    return `Score points across ${scoring.attempts} ${scoring.unit}. Higher is better.`;
  }
  return `Accumulate a total ${scoring.unit} score.`;
}

export function isLowerBetter(scoring: ScoringConfig): boolean {
  return scoring.type === 'strokes';
}

export function targetAttemptCount(scoring: ScoringConfig): number | null {
  if (scoring.type === 'makes_out_of') return scoring.attempts;
  if (scoring.type === 'strokes') return scoring.holes;
  if (scoring.type === 'score_total') return scoring.attempts ?? null;
  if (scoring.type === 'reps') return scoring.target ?? null;
  return null;
}
