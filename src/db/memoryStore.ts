import type {
  Attempt,
  AttemptPayload,
  Drill,
  Pack,
  Session,
  SessionStatus,
  Settings,
} from '@/src/domain/types';

export type CreateSessionInput = {
  id: string;
  drillId: string;
  drillName: string;
  drillCategory: Drill['category'];
  startedAt: string;
};

export type AppStore = {
  listPacks(): Promise<Pack[]>;
  getPack(id: string): Promise<Pack | null>;
  upsertPack(pack: Pack): Promise<void>;
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
        'status' | 'endedAt' | 'notes' | 'summaryScore' | 'summaryValue'
      >
    >,
  ): Promise<Session>;
  addAttempt(input: {
    id: string;
    sessionId: string;
    index: number;
    payload: AttemptPayload;
    createdAt: string;
  }): Promise<Attempt>;
  listAttempts(sessionId: string): Promise<Attempt[]>;
  getSettings(): Promise<Settings>;
  setDisplayName(name: string): Promise<Settings>;
  clearUserData(): Promise<void>;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createMemoryStore(): AppStore {
  let packs: Pack[] = [];
  let drills: Drill[] = [];
  let sessions: Session[] = [];
  let attempts: Attempt[] = [];
  let settings: Settings = { displayName: '' };

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
    },
    async replaceDrillsForPack(packId, next) {
      drills = drills.filter((d) => d.packId !== packId).concat(clone(next));
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
      };
      sessions.unshift(clone(session));
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
      return clone(sessions[idx]);
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
      return clone(attempt);
    },
    async listAttempts(sessionId) {
      return clone(
        attempts
          .filter((a) => a.sessionId === sessionId)
          .sort((a, b) => a.index - b.index),
      );
    },
    async getSettings() {
      return clone(settings);
    },
    async setDisplayName(name) {
      settings = { displayName: name };
      return clone(settings);
    },
    async clearUserData() {
      packs = [];
      drills = [];
      sessions = [];
      attempts = [];
      settings = { displayName: '' };
    },
  };
}
