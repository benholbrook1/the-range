import * as SQLite from 'expo-sqlite';

import type {
  Attempt,
  Drill,
  Pack,
  Session,
  Settings,
} from '@/src/domain/types';
import type { AppStore, CreateSessionInput } from '@/src/db/memoryStore';

type SqlDb = SQLite.SQLiteDatabase;

async function migrate(db: SqlDb) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS packs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      source TEXT NOT NULL,
      installed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS drills (
      id TEXT PRIMARY KEY NOT NULL,
      pack_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      estimated_minutes REAL NOT NULL,
      instructions_json TEXT NOT NULL,
      scoring_json TEXT NOT NULL,
      FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      drill_id TEXT NOT NULL,
      drill_name TEXT NOT NULL,
      drill_category TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      notes TEXT,
      summary_score TEXT,
      summary_value REAL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      attempt_index INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

function mapPack(row: Record<string, unknown>): Pack {
  return {
    id: String(row.id),
    name: String(row.name),
    schemaVersion: Number(row.schema_version),
    source: row.source as Pack['source'],
    installedAt: String(row.installed_at),
  };
}

function mapDrill(row: Record<string, unknown>): Drill {
  return {
    id: String(row.id),
    packId: String(row.pack_id),
    name: String(row.name),
    category: row.category as Drill['category'],
    estimatedMinutes: Number(row.estimated_minutes),
    instructions: JSON.parse(String(row.instructions_json)) as string[],
    scoring: JSON.parse(String(row.scoring_json)) as Drill['scoring'],
  };
}

function mapSession(row: Record<string, unknown>): Session {
  return {
    id: String(row.id),
    drillId: String(row.drill_id),
    drillName: String(row.drill_name),
    drillCategory: row.drill_category as Session['drillCategory'],
    status: row.status as Session['status'],
    startedAt: String(row.started_at),
    endedAt: row.ended_at == null ? null : String(row.ended_at),
    notes: row.notes == null ? null : String(row.notes),
    summaryScore: row.summary_score == null ? null : String(row.summary_score),
    summaryValue:
      row.summary_value == null ? null : Number(row.summary_value),
  };
}

function mapAttempt(row: Record<string, unknown>): Attempt {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    index: Number(row.attempt_index),
    payload: JSON.parse(String(row.payload_json)) as Attempt['payload'],
    createdAt: String(row.created_at),
  };
}

export async function openSqliteStore(): Promise<AppStore> {
  const db = await SQLite.openDatabaseAsync('the-range.db');
  await migrate(db);
  return createSqliteStore(db);
}

export function createSqliteStore(db: SqlDb): AppStore {
  return {
    async listPacks() {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM packs ORDER BY name ASC',
      );
      return rows.map(mapPack);
    },
    async getPack(id) {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM packs WHERE id = ?',
        id,
      );
      return row ? mapPack(row) : null;
    },
    async upsertPack(pack) {
      await db.runAsync(
        `INSERT INTO packs (id, name, schema_version, source, installed_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           schema_version = excluded.schema_version,
           source = excluded.source,
           installed_at = excluded.installed_at`,
        pack.id,
        pack.name,
        pack.schemaVersion,
        pack.source,
        pack.installedAt,
      );
    },
    async replaceDrillsForPack(packId, drills) {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM drills WHERE pack_id = ?', packId);
        for (const drill of drills) {
          await db.runAsync(
            `INSERT INTO drills
              (id, pack_id, name, category, estimated_minutes, instructions_json, scoring_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            drill.id,
            drill.packId,
            drill.name,
            drill.category,
            drill.estimatedMinutes,
            JSON.stringify(drill.instructions),
            JSON.stringify(drill.scoring),
          );
        }
      });
    },
    async listDrills(opts = {}) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM drills ORDER BY name ASC',
      );
      let drills = rows.map(mapDrill);
      if (opts.category && opts.category !== 'all') {
        drills = drills.filter((d) => d.category === opts.category);
      }
      if (opts.query?.trim()) {
        const q = opts.query.trim().toLowerCase();
        drills = drills.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q),
        );
      }
      return drills;
    },
    async getDrill(id) {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM drills WHERE id = ?',
        id,
      );
      return row ? mapDrill(row) : null;
    },
    async createSession(input: CreateSessionInput) {
      await db.runAsync(
        `INSERT INTO sessions
          (id, drill_id, drill_name, drill_category, status, started_at, ended_at, notes, summary_score, summary_value)
         VALUES (?, ?, ?, ?, 'active', ?, NULL, NULL, NULL, NULL)`,
        input.id,
        input.drillId,
        input.drillName,
        input.drillCategory,
        input.startedAt,
      );
      const session = await this.getSession(input.id);
      if (!session) throw new Error('Failed to create session');
      return session;
    },
    async getSession(id) {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM sessions WHERE id = ?',
        id,
      );
      return row ? mapSession(row) : null;
    },
    async getActiveSession() {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT * FROM sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1`,
      );
      return row ? mapSession(row) : null;
    },
    async listSessions(opts = {}) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM sessions ORDER BY started_at DESC',
      );
      let sessions = rows.map(mapSession);
      if (opts.status) sessions = sessions.filter((s) => s.status === opts.status);
      if (opts.drillId) sessions = sessions.filter((s) => s.drillId === opts.drillId);
      if (opts.category && opts.category !== 'all') {
        sessions = sessions.filter((s) => s.drillCategory === opts.category);
      }
      return sessions;
    },
    async updateSession(id, patch) {
      const current = await this.getSession(id);
      if (!current) throw new Error(`Session not found: ${id}`);
      const next = { ...current, ...patch };
      await db.runAsync(
        `UPDATE sessions SET
          status = ?, ended_at = ?, notes = ?, summary_score = ?, summary_value = ?
         WHERE id = ?`,
        next.status,
        next.endedAt,
        next.notes,
        next.summaryScore,
        next.summaryValue,
        id,
      );
      return next;
    },
    async addAttempt(input) {
      await db.runAsync(
        `INSERT INTO attempts (id, session_id, attempt_index, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        input.id,
        input.sessionId,
        input.index,
        JSON.stringify(input.payload),
        input.createdAt,
      );
      return {
        id: input.id,
        sessionId: input.sessionId,
        index: input.index,
        payload: input.payload,
        createdAt: input.createdAt,
      };
    },
    async listAttempts(sessionId) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM attempts WHERE session_id = ? ORDER BY attempt_index ASC',
        sessionId,
      );
      return rows.map(mapAttempt);
    },
    async getSettings() {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT value FROM settings WHERE key = 'displayName'`,
      );
      return { displayName: row ? String(row.value) : '' };
    },
    async setDisplayName(name) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES ('displayName', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        name,
      );
      return { displayName: name };
    },
    async clearUserData() {
      await db.execAsync(`
        DELETE FROM attempts;
        DELETE FROM sessions;
        DELETE FROM drills;
        DELETE FROM packs;
        DELETE FROM settings;
      `);
    },
  };
}
