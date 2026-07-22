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
import { getHandicapSnapshot } from '@/src/services/handicap';
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
  it('bootstraps bundled games and supports list/filter', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    const all = await listDrills(store);
    expect(all.length).toBeGreaterThanOrEqual(8);
    expect(all.every((d) => d.visual)).toBe(true);
    const putting = await listDrills(store, { category: 'putting' });
    expect(putting.every((d) => d.category === 'putting')).toBe(true);
    const search = await listDrills(store, { query: 'par' });
    expect(search.some((d) => d.id === 'par-18')).toBe(true);
  });

  it('re-runs bootstrap to refresh bundled drills', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    const before = (await listDrills(store)).length;
    await bootstrapApp(store);
    expect((await listDrills(store)).length).toBe(before);
    expect(await getDrill(store, 'par-18')).not.toBeNull();
    expect(await getDrill(store, 'clock-face')).not.toBeNull();
  });

  it('runs session lifecycle, undo, and resume', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    const session = await startSession(store, 'gate-keeper');
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

    const best = await getPersonalBest(store, 'gate-keeper');
    expect(best?.label).toBe('1/10');
    const last = await getLastScore(store, 'gate-keeper');
    expect(last?.label).toBe('1/10');
    const options = await listHistoryDrillOptions(store);
    expect(options.some((o) => o.id === 'gate-keeper')).toBe(true);
  });

  it('tracks Par 18 strokes and prefers lower personal best', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);

    const high = await startSession(store, 'par-18');
    for (const strokes of [3, 3, 3]) {
      await logAttempt(store, high.id, { type: 'strokes', strokes });
    }
    await completeSession(store, high.id);

    const low = await startSession(store, 'par-18');
    for (const strokes of [1, 2, 2]) {
      await logAttempt(store, low.id, { type: 'strokes', strokes });
    }
    const finished = await completeSession(store, low.id);
    expect(finished.summaryScore).toMatch(/^5 /);
    expect(finished.differential).toBe(-1); // 5 strokes vs par 6

    const best = await getPersonalBest(store, 'par-18');
    expect(best?.value).toBe(5);
  });

  it('builds area handicaps from completed differentials', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);

    const session = await startSession(store, 'gate-keeper');
    for (let i = 0; i < 10; i++) {
      await logAttempt(store, session.id, {
        type: 'makes_out_of',
        made: i < 8,
      });
    }
    const done = await completeSession(store, session.id);
    expect(done.differential).toBe(7.2); // miss rate 0.2 * 36

    const snap = await getHandicapSnapshot(store);
    const putting = snap.areas.find((a) => a.category === 'putting');
    expect(putting?.index).toBe(7.2);
    expect(putting?.rounds).toBe(1);
    expect(snap.overall).toBe(7.2);
  });

  it('discards active session and can start another', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    await startSession(store, 'gate-keeper');
    await expect(startSession(store, 'lag-zone')).rejects.toThrow(
      /active session/i,
    );
    await discardActiveSession(store);
    const next = await startSession(store, 'lag-zone');
    expect(next.drillId).toBe('lag-zone');
  });

  it('starts with discardActive option', async () => {
    const store = createMemoryStore();
    await bootstrapApp(store);
    await startSession(store, 'gate-keeper');
    const next = await startSession(store, 'circle-game', {
      discardActive: true,
    });
    expect(next.drillId).toBe('circle-game');
    expect((await getActiveSession(store))?.drillId).toBe('circle-game');
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
    await startSession(store, 'gate-keeper');
    await clearAllAndReseed(store);
    expect(await getActiveSession(store)).toBeNull();
    expect((await listDrills(store)).length).toBeGreaterThan(0);
  });
});
