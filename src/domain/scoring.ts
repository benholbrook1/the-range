import type { Attempt, AttemptPayload, ScoringConfig } from './types';

export type ScoreSummary = {
  label: string;
  value: number;
  detail: string;
};

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

  const total = attempts.reduce((sum, a) => {
    if (a.payload.type === 'score_total') return sum + a.payload.points;
    return sum;
  }, 0);
  return {
    label: String(total),
    value: total,
    detail: `${total} ${scoring.unit}`,
  };
}


export function createAttemptPayload(
  scoring: ScoringConfig,
  input: { made?: boolean; count?: number; points?: number },
): AttemptPayload {
  if (scoring.type === 'makes_out_of') {
    return { type: 'makes_out_of', made: Boolean(input.made) };
  }
  if (scoring.type === 'reps') {
    return { type: 'reps', count: Math.max(0, Number(input.count ?? 0)) };
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
  return `Accumulate a total ${scoring.unit} score.`;
}
