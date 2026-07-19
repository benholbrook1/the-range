import type { AppStore } from '@/src/db/memoryStore';
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
  const sessions = await store.listSessions({
    status: 'completed',
    drillId,
  });
  const scored = sessions.filter(
    (s) => s.summaryValue != null && s.summaryScore != null,
  );
  if (scored.length === 0) return null;
  scored.sort((a, b) => (b.summaryValue ?? 0) - (a.summaryValue ?? 0));
  const best = scored[0];
  return { label: best.summaryScore!, value: best.summaryValue! };
}

export async function getLastCompletedSession(
  store: AppStore,
): Promise<{ drillId: string; drillName: string; startedAt: string } | null> {
  const sessions = await store.listSessions({ status: 'completed' });
  if (sessions.length === 0) return null;
  const s = sessions[0];
  return {
    drillId: s.drillId,
    drillName: s.drillName,
    startedAt: s.startedAt,
  };
}
