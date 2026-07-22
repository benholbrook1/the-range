import type {
  Attempt,
  AttemptPayload,
  Drill,
  Pack,
  Session,
  SessionStatus,
  Settings,
} from '@/src/domain/types';
import { DEFAULT_SETTINGS } from '@/src/domain/types';

export type CreateSessionInput = {
  id: string;
  drillId: string;
  drillName: string;
  drillCategory: Drill['category'];
  startedAt: string;
};

export type StoreSnapshot = {
  packs: Pack[];
  drills: Drill[];
  sessions: Session[];
  attempts: Attempt[];
  settings: Settings;
};

export type AppStore = {
  listPacks(): Promise<Pack[]>;
  getPack(id: string): Promise<Pack | null>;
  upsertPack(pack: Pack): Promise<void>;
  removePack(packId: string): Promise<void>;
  replaceDrillsForPack(packId: string, drills: Drill[]): Promise<void>;
  listDrills(opts?: {
    category?: Drill['category'] | 'all';
    query?: string;
  }): Promise<Drill[]>;
  getDrill(id: string): Promise<Drill | null>;
  createSession(input: CreateSessionInput): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  getActiveSession(): Promise<Session | null>;
  listSessions(opts?: {
    status?: SessionStatus;
    drillId?: string;
    category?: Drill['category'] | 'all';
  }): Promise<Session[]>;
  updateSession(
    id: string,
    patch: Partial<
      Pick<
        Session,
        | 'status'
        | 'endedAt'
        | 'notes'
        | 'summaryScore'
        | 'summaryValue'
        | 'differential'
      >
    >,
  ): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  addAttempt(input: {
    id: string;
    sessionId: string;
    index: number;
    payload: AttemptPayload;
    createdAt: string;
  }): Promise<Attempt>;
  listAttempts(sessionId: string): Promise<Attempt[]>;
  removeLastAttempt(sessionId: string): Promise<Attempt | null>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  clearUserData(): Promise<void>;
  exportSnapshot(): Promise<StoreSnapshot>;
  importSnapshot(snapshot: StoreSnapshot): Promise<void>;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createMemoryStore(
  initial?: Partial<StoreSnapshot>,
  onChange?: (snapshot: StoreSnapshot) => void,
): AppStore {
  let packs: Pack[] = clone(initial?.packs ?? []);
  let drills: Drill[] = clone(initial?.drills ?? []);
  let sessions: Session[] = clone(initial?.sessions ?? []);
  let attempts: Attempt[] = clone(initial?.attempts ?? []);
  let settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...(initial?.settings ?? {}),
  };

  function notify() {
    onChange?.({
      packs: clone(packs),
      drills: clone(drills),
      sessions: clone(sessions),
      attempts: clone(attempts),
      settings: clone(settings),
    });
  }

  return {
    async listPacks() {
      return clone(packs).sort((a, b) => a.name.localeCompare(b.name));
    },
    async getPack(id) {
      return clone(packs.find((p) => p.id === id) ?? null);
    },
    async upsertPack(pack) {
      const idx = packs.findIndex((p) => p.id === pack.id);
      if (idx >= 0) packs[idx] = clone(pack);
      else packs.push(clone(pack));
      notify();
    },
    async removePack(packId) {
      packs = packs.filter((p) => p.id !== packId);
      drills = drills.filter((d) => d.packId !== packId);
      notify();
    },
    async replaceDrillsForPack(packId, next) {
      drills = drills.filter((d) => d.packId !== packId).concat(clone(next));
      notify();
    },
    async listDrills(opts = {}) {
      let rows = drills.slice();
      if (opts.category && opts.category !== 'all') {
        rows = rows.filter((d) => d.category === opts.category);
      }
      if (opts.query?.trim()) {
        const q = opts.query.trim().toLowerCase();
        rows = rows.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q),
        );
      }
      return clone(rows).sort((a, b) => a.name.localeCompare(b.name));
    },
    async getDrill(id) {
      return clone(drills.find((d) => d.id === id) ?? null);
    },
    async createSession(input) {
      const session: Session = {
        id: input.id,
        drillId: input.drillId,
        drillName: input.drillName,
        drillCategory: input.drillCategory,
        status: 'active',
        startedAt: input.startedAt,
        endedAt: null,
        notes: null,
        summaryScore: null,
        summaryValue: null,
        differential: null,
      };
      sessions.unshift(clone(session));
      notify();
      return clone(session);
    },
    async getSession(id) {
      return clone(sessions.find((s) => s.id === id) ?? null);
    },
    async getActiveSession() {
      return clone(sessions.find((s) => s.status === 'active') ?? null);
    },
    async listSessions(opts = {}) {
      let rows = sessions.slice();
      if (opts.status) rows = rows.filter((s) => s.status === opts.status);
      if (opts.drillId) rows = rows.filter((s) => s.drillId === opts.drillId);
      if (opts.category && opts.category !== 'all') {
        rows = rows.filter((s) => s.drillCategory === opts.category);
      }
      return clone(
        rows.sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        ),
      );
    },
    async updateSession(id, patch) {
      const idx = sessions.findIndex((s) => s.id === id);
      if (idx < 0) throw new Error(`Session not found: ${id}`);
      sessions[idx] = { ...sessions[idx], ...patch };
      notify();
      return clone(sessions[idx]);
    },
    async deleteSession(id) {
      sessions = sessions.filter((s) => s.id !== id);
      attempts = attempts.filter((a) => a.sessionId !== id);
      notify();
    },
    async addAttempt(input) {
      const attempt: Attempt = {
        id: input.id,
        sessionId: input.sessionId,
        index: input.index,
        payload: input.payload,
        createdAt: input.createdAt,
      };
      attempts.push(clone(attempt));
      notify();
      return clone(attempt);
    },
    async listAttempts(sessionId) {
      return clone(
        attempts
          .filter((a) => a.sessionId === sessionId)
          .sort((a, b) => a.index - b.index),
      );
    },
    async removeLastAttempt(sessionId) {
      const sessionAttempts = attempts
        .filter((a) => a.sessionId === sessionId)
        .sort((a, b) => a.index - b.index);
      const last = sessionAttempts[sessionAttempts.length - 1];
      if (!last) return null;
      attempts = attempts.filter((a) => a.id !== last.id);
      notify();
      return clone(last);
    },
    async getSettings() {
      return clone(settings);
    },
    async updateSettings(patch) {
      settings = { ...settings, ...patch };
      notify();
      return clone(settings);
    },
    async clearUserData() {
      packs = [];
      drills = [];
      sessions = [];
      attempts = [];
      settings = { ...DEFAULT_SETTINGS };
      notify();
    },
    async exportSnapshot() {
      return {
        packs: clone(packs),
        drills: clone(drills),
        sessions: clone(sessions),
        attempts: clone(attempts),
        settings: clone(settings),
      };
    },
    async importSnapshot(snapshot) {
      packs = clone(snapshot.packs);
      drills = clone(snapshot.drills);
      sessions = clone(snapshot.sessions);
      attempts = clone(snapshot.attempts);
      settings = { ...DEFAULT_SETTINGS, ...clone(snapshot.settings) };
      notify();
    },
  };
}
