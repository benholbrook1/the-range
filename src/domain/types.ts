export type DrillCategory = 'putting' | 'short_game' | 'full_swing' | 'other';

export type DrillVisualId =
  | 'par18'
  | 'clock'
  | 'gate'
  | 'lag'
  | 'rings'
  | 'corridor'
  | 'ladder'
  | 'pressure';

export type ScoringType = 'makes_out_of' | 'reps' | 'score_total' | 'strokes';

export type MakesOutOfScoring = {
  type: 'makes_out_of';
  attempts: number;
  unit: string;
};

export type RepsScoring = {
  type: 'reps';
  target?: number;
  unit: string;
};

export type ScoreTotalScoring = {
  type: 'score_total';
  unit: string;
  /** Optional fixed number of shots for progress / completion prompts. */
  attempts?: number;
};

export type StrokesScoring = {
  type: 'strokes';
  holes: number;
  parPerHole: number;
  unit: string;
};

export type ScoringConfig =
  | MakesOutOfScoring
  | RepsScoring
  | ScoreTotalScoring
  | StrokesScoring;

export type Pack = {
  id: string;
  name: string;
  schemaVersion: number;
  source: 'bundled' | 'imported';
  installedAt: string;
};

export type Drill = {
  id: string;
  packId: string;
  name: string;
  category: DrillCategory;
  estimatedMinutes: number;
  instructions: string[];
  scoring: ScoringConfig;
  /** Diagram key for consistent on-screen visuals. */
  visual?: DrillVisualId;
};

export type SessionStatus = 'active' | 'completed';

export type Session = {
  id: string;
  drillId: string;
  drillName: string;
  drillCategory: DrillCategory;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  summaryScore: string | null;
  summaryValue: number | null;
};

export type AttemptPayload =
  | { type: 'makes_out_of'; made: boolean }
  | { type: 'reps'; count: number }
  | { type: 'score_total'; points: number }
  | { type: 'strokes'; strokes: number };

export type Attempt = {
  id: string;
  sessionId: string;
  index: number;
  payload: AttemptPayload;
  createdAt: string;
};

export type DistanceUnits = 'yards' | 'meters';

export type Settings = {
  displayName: string;
  units: DistanceUnits;
};

export const DEFAULT_SETTINGS: Settings = {
  displayName: '',
  units: 'yards',
};
