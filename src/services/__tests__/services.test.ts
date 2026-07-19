import { createMemoryStore } from '@/src/db/memoryStore';
import { bootstrapApp, clearAllAndReseed } from '@/src/services/bootstrap';
import {
  getDrill,
  getPersonalBest,
  listDrills,
} from '@/src/services/drills';
import { tryInstallPackPayload } from '@/src/services/packs';
import {
  completeSession,
  getActiveSession,
  listHistory,
  logAttempt,
  startSession,
} from '@/src/services/sessions';

describe('services with memory store', () => {
  it('bootstraps bundled drills and supports list/filter', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    const all = await listDrills(store);
    expect(all.length).toBeGreaterThanOrEqual(5);
    const putting = await listDrills(store, { category: 'putting' });
    expect(putting.every((d) => d.category === 'putting')).toBe(true);
    const search = await listDrills(store, { query: 'gate' });
    expect(search.some((d) => d.id === 'gate-putting-3ft')).toBe(true);
  });

  it('runs session lifecycle and resume', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    const session = await startSession(store, 'gate-putting-3ft');
    expect(session.status).toBe('active');
    expect((await getActiveSession(store))?.id).toBe(session.id);

    await logAttempt(store, session.id, {
      type: 'makes_out_of',
      made: true,
    });
    await logAttempt(store, session.id, {
      type: 'makes_out_of',
      made: false,
    });

    const stillActive = await getActiveSession(store);
    expect(stillActive?.id).toBe(session.id);

    const completed = await completeSession(store, session.id, 'solid tempo');
    expect(completed.status).toBe('completed');
    expect(completed.summaryScore).toBe('1/10');
    expect(await getActiveSession(store)).toBeNull();

    const history = await listHistory(store);
    expect(history[0]?.id).toBe(session.id);

    const best = await getPersonalBest(store, 'gate-putting-3ft');
    expect(best?.label).toBe('1/10');
  });

  it('rejects invalid packs and installs valid ones', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    const bad = await tryInstallPackPayload(
      store,
      { schemaVersion: 1, packId: 'x', name: 'x', drills: [] },
      'imported',
    );
    expect(bad.ok).toBe(false);

    const good = await tryInstallPackPayload(
      store,
      {
        schemaVersion: 1,
        packId: 'extra-v1',
        name: 'Extra Pack',
        drills: [
          {
            id: 'extra-drill',
            name: 'Extra Drill',
            category: 'other',
            estimatedMinutes: 5,
            instructions: ['Do the thing'],
            scoring: { type: 'reps', unit: 'reps', target: 5 },
          },
        ],
      },
      'imported',
    );
    expect(good.ok).toBe(true);
    expect(await getDrill(store, 'extra-drill')).not.toBeNull();
  });

  it('clear and reseed restores starter drills', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    await startSession(store, 'gate-putting-3ft');
    await clearAllAndReseed(store);
    expect(await getActiveSession(store)).toBeNull();
    expect((await listDrills(store)).length).toBeGreaterThan(0);
  });
});
