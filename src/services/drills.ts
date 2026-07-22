import type { AppStore } from '@/src/db/memoryStore';
import { isLowerBetter } from '@/src/domain/scoring';
import type { Drill } from '@/src/domain/types';

export async function listDrills(
  store: AppStore,
  opts?: { category?: Drill['category'] | 'all'; query?: string },
): Promise<Drill[]> {
  return store.listDrills(opts);
}

export async function getDrill(
  store: AppStore,
  id: string,
): Promise<Drill | null> {
  return store.getDrill(id);
}

export async function getPersonalBest(
  store: AppStore,
  drillId: string,
): Promise<{ label: string; value: number } | null> {
  const [sessions, drill] = await Promise.all([
    store.listSessions({
      status: 'completed',
      drillId,
    }),
    store.getDrill(drillId),
  ]);
  const scored = sessions.filter(
    (s) => s.summaryValue != null && s.summaryScore != null,
  );
  if (scored.length === 0) return null;
  const lower = drill ? isLowerBetter(drill.scoring) : false;
  scored.sort((a, b) =>
    lower
      ? (a.summaryValue ?? 0) - (b.summaryValue ?? 0)
      : (b.summaryValue ?? 0) - (a.summaryValue ?? 0),
  );
  const best = scored[0];
  return { label: best.summaryScore!, value: best.summaryValue! };
}

export async function getLastScore(
  store: AppStore,
  drillId: string,
): Promise<{ label: string; startedAt: string } | null> {
  const sessions = await store.listSessions({
    status: 'completed',
    drillId,
  });
  const scored = sessions.filter((s) => s.summaryScore != null);
  if (scored.length === 0) return null;
  const last = scored[0];
  return { label: last.summaryScore!, startedAt: last.startedAt };
}

export async function getLastCompletedSession(
  store: AppStore,
): Promise<{
  drillId: string;
  drillName: string;
  startedAt: string;
  summaryScore: string | null;
  sessionId: string;
  differential: number | null;
  drillCategory: import('@/src/domain/types').DrillCategory;
} | null> {
  const sessions = await store.listSessions({ status: 'completed' });
  if (sessions.length === 0) return null;
  const s = sessions[0];
  return {
    drillId: s.drillId,
    drillName: s.drillName,
    startedAt: s.startedAt,
    summaryScore: s.summaryScore,
    sessionId: s.id,
    differential: s.differential,
    drillCategory: s.drillCategory,
  };
}

/** Distinct drills that appear in completed history (for filters). */
export async function listHistoryDrillOptions(
  store: AppStore,
): Promise<Array<{ id: string; name: string }>> {
  const sessions = await store.listSessions({ status: 'completed' });
  const map = new Map<string, string>();
  for (const s of sessions) {
    if (!map.has(s.drillId)) map.set(s.drillId, s.drillName);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
