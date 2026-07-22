import type { AppStore } from '@/src/db/memoryStore';
import {
  buildHandicapSnapshot,
  computeDifferential,
  formatDifferential,
  formatHandicap,
  isHandicapArea,
  type HandicapSnapshot,
} from '@/src/domain/handicap';
import { categoryLabel } from '@/src/domain/categories';
import type { DrillCategory, Session } from '@/src/domain/types';

export async function getHandicapSnapshot(
  store: AppStore,
): Promise<HandicapSnapshot> {
  const sessions = await store.listSessions({ status: 'completed' });
  const byCategory: Partial<Record<DrillCategory, number[]>> = {};

  for (const session of sessions) {
    if (!isHandicapArea(session.drillCategory)) continue;
    if (session.differential == null) continue;
    const list = byCategory[session.drillCategory] ?? [];
    list.push(session.differential);
    byCategory[session.drillCategory] = list;
  }

  return buildHandicapSnapshot(byCategory);
}

export async function getAreaIndex(
  store: AppStore,
  category: DrillCategory,
): Promise<number | null> {
  const snap = await getHandicapSnapshot(store);
  return snap.areas.find((a) => a.category === category)?.index ?? null;
}

export function differentialForSession(
  scoring: Parameters<typeof computeDifferential>[0],
  summaryValue: number,
  attemptCount: number,
): number | null {
  return computeDifferential(scoring, summaryValue, attemptCount);
}

export function describeSessionHandicapImpact(session: Session): string | null {
  if (session.differential == null) return null;
  if (!isHandicapArea(session.drillCategory)) return null;
  return `${categoryLabel(session.drillCategory)} diff ${formatDifferential(session.differential)}`;
}

export { formatHandicap, formatDifferential };
