import type { AppStore } from '@/src/db/memoryStore';
import { computeDifferential } from '@/src/domain/handicap';
import { summarizeAttempts } from '@/src/domain/scoring';
import type {
  Attempt,
  AttemptPayload,
  Drill,
  Session,
} from '@/src/domain/types';

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function startSession(
  store: AppStore,
  drillId: string,
  opts?: { discardActive?: boolean },
): Promise<Session> {
  const drill = await store.getDrill(drillId);
  if (!drill) throw new Error(`Drill not found: ${drillId}`);

  const existing = await store.getActiveSession();
  if (existing) {
    if (opts?.discardActive) {
      await store.deleteSession(existing.id);
    } else {
      throw new Error(
        'An active session already exists. Resume, save, or discard it first.',
      );
    }
  }

  return store.createSession({
    id: newId('sess'),
    drillId: drill.id,
    drillName: drill.name,
    drillCategory: drill.category,
    startedAt: new Date().toISOString(),
  });
}

export async function getActiveSession(
  store: AppStore,
): Promise<Session | null> {
  return store.getActiveSession();
}

export async function discardActiveSession(store: AppStore): Promise<void> {
  const active = await store.getActiveSession();
  if (active) {
    await store.deleteSession(active.id);
  }
}

export async function logAttempt(
  store: AppStore,
  sessionId: string,
  payload: AttemptPayload,
): Promise<Attempt> {
  const session = await store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status !== 'active') {
    throw new Error('Cannot log attempts on a completed session');
  }
  const existing = await store.listAttempts(sessionId);
  return store.addAttempt({
    id: newId('att'),
    sessionId,
    index: existing.length,
    payload,
    createdAt: new Date().toISOString(),
  });
}

export async function undoLastAttempt(
  store: AppStore,
  sessionId: string,
): Promise<Attempt | null> {
  const session = await store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status !== 'active') {
    throw new Error('Cannot undo on a completed session');
  }
  return store.removeLastAttempt(sessionId);
}

export async function completeSession(
  store: AppStore,
  sessionId: string,
  notes?: string,
): Promise<Session> {
  const session = await store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  const drill = await store.getDrill(session.drillId);
  if (!drill) throw new Error(`Drill missing for session: ${session.drillId}`);
  const attempts = await store.listAttempts(sessionId);
  const summary = summarizeAttempts(drill.scoring, attempts);
  const differential = computeDifferential(
    drill.scoring,
    summary.value,
    attempts.length,
  );
  return store.updateSession(sessionId, {
    status: 'completed',
    endedAt: new Date().toISOString(),
    notes: notes?.trim() ? notes.trim() : null,
    summaryScore: summary.label,
    summaryValue: summary.value,
    differential,
  });
}

export async function listHistory(
  store: AppStore,
  opts?: { drillId?: string; category?: Drill['category'] | 'all' },
): Promise<Session[]> {
  return store.listSessions({
    status: 'completed',
    drillId: opts?.drillId,
    category: opts?.category,
  });
}

export async function getSessionDetail(
  store: AppStore,
  sessionId: string,
): Promise<{ session: Session; attempts: Attempt[]; drill: Drill | null }> {
  const session = await store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  const attempts = await store.listAttempts(sessionId);
  const drill = await store.getDrill(session.drillId);
  return { session, attempts, drill };
}
