import { createMemoryStore } from '@/src/db/memoryStore';
import { bootstrapApp, clearAllAndReseed } from '@/src/services/bootstrap';
import {
  getDrill,
  getLastScore,
  getPersonalBest,
  listDrills,
  listHistoryDrillOptions,
} from '@/src/services/drills';
import {
  tryInstallPackPayload,
  uninstallPack,
} from '@/src/services/packs';
import {
  completeSession,
  discardActiveSession,
  getActiveSession,
  listHistory,
  logAttempt,
  startSession,
  undoLastAttempt,
} from '@/src/services/sessions';
import { getSettings, setUnits } from '@/src/services/settings';

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

  it('runs session lifecycle, undo, and resume', async () => {
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
    const undone = await undoLastAttempt(store, session.id);
    expect(undone?.payload).toEqual({ type: 'makes_out_of', made: false });

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
    const last = await getLastScore(store, 'gate-putting-3ft');
    expect(last?.label).toBe('1/10');
    const options = await listHistoryDrillOptions(store);
    expect(options.some((o) => o.id === 'gate-putting-3ft')).toBe(true);
  });

  it('discards active session and can start another', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    await startSession(store, 'gate-putting-3ft');
    await expect(startSession(store, 'lag-putting-20ft')).rejects.toThrow(
      /active session/i,
    );
    await discardActiveSession(store);
    const next = await startSession(store, 'lag-putting-20ft');
    expect(next.drillId).toBe('lag-putting-20ft');
  });

  it('starts with discardActive option', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    await startSession(store, 'gate-putting-3ft');
    const next = await startSession(store, 'chip-to-circle', {
      discardActive: true,
    });
    expect(next.drillId).toBe('chip-to-circle');
    expect((await getActiveSession(store))?.drillId).toBe('chip-to-circle');
  });

  it('rejects invalid packs, installs valid ones, and uninstalls', async () => {
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
    await uninstallPack(store, 'extra-v1');
    expect(await getDrill(store, 'extra-drill')).toBeNull();
  });

  it('updates units and clear/reseed restores starter drills', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    await setUnits(store, 'meters');
    expect((await getSettings(store)).units).toBe('meters');
    await startSession(store, 'gate-putting-3ft');
    await clearAllAndReseed(store);
    expect(await getActiveSession(store)).toBeNull();
    expect((await listDrills(store)).length).toBeGreaterThan(0);
  });
});
