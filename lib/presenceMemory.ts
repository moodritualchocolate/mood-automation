/**
 * PRESENCE MEMORY (FIFO, append-only)
 *
 * Persistent FIFO of HUMAN PRESENCE SNAPSHOTS — passive observations
 * of presence signals at a moment in time.
 *
 * STRICT CONTRACT:
 *   - the memory stores OBSERVATIONS only
 *   - no optimization history
 *   - no generation history
 *   - no execution history
 *   - FIFO-capped
 *
 * Lives at data/memory/presence-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { PresenceSignals } from './humanPresenceEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'presence-memory.json';

export const PRESENCE_SNAPSHOT_LIMIT = 128;

// ─── snapshot ────────────────────────────────────────────────

export interface PresenceSnapshot {
  at: number;
  presenceScore: number;
  signals: PresenceSignals;
  stillnessWeight: number;
  authenticityWeight: number;
  imperfectionSignature: number;
  vulnerabilitySignals: number;
  emotionalBreathing: number;
  listeningSignals: number;
  humanityRetention: number;
  syntheticPressure: number;
  dignityProtection: number;
  dominantPresenceSignals: string[];
  observationCount: number;
}

export interface PresenceMemoryState {
  snapshots: PresenceSnapshot[];
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialPresenceMemory(): PresenceMemoryState {
  return { snapshots: [], totalSnapshots: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── pure transform ──────────────────────────────────────────

export function appendPresenceSnapshot(
  state: PresenceMemoryState,
  snapshot: PresenceSnapshot,
): PresenceMemoryState {
  const snapshots = [...state.snapshots, snapshot].slice(-PRESENCE_SNAPSHOT_LIMIT);
  return {
    ...state,
    snapshots,
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodPresence?: PresenceMemoryState };

export interface PresenceMemoryStore {
  read(): Promise<PresenceMemoryState>;
  append(snapshot: PresenceSnapshot): Promise<PresenceMemoryState>;
  save(state: PresenceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createPresenceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): PresenceMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: PresenceMemoryStore = {
    async read() {
      if (g.__moodPresence) return g.__moodPresence;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<PresenceMemoryState>;
        g.__moodPresence = { ...createInitialPresenceMemory(), ...parsed };
      } catch {
        g.__moodPresence = createInitialPresenceMemory();
      }
      return g.__moodPresence;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = appendPresenceSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-PRESENCE_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodPresence = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPresence = undefined;
    },
  };
  return store;
}
