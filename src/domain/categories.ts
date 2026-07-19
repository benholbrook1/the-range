import type { DrillCategory } from './types';

const LABELS: Record<DrillCategory, string> = {
  putting: 'Putting',
  short_game: 'Short Game',
  full_swing: 'Full Swing',
  other: 'Other',
};

export const ALL_CATEGORIES: Array<DrillCategory | 'all'> = [
  'all',
  'putting',
  'short_game',
  'full_swing',
  'other',
];

export function categoryLabel(category: DrillCategory | 'all'): string {
  if (category === 'all') return 'All';
  return LABELS[category];
}

export function isDrillCategory(value: string): value is DrillCategory {
  return value in LABELS;
}
