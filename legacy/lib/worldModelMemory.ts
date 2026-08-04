/**
 * WORLD MODEL MEMORY (FIFO, append-only)
 *
 * Persistent FIFO of world-state snapshots — composed of world model
 * signals + aesthetic migration + collective attention + civilizational
 * mood + meaning pressure. Each snapshot is a passive OBSERVATION of
 * collective human movement at a moment in time.
 *
 * STRICT CONTRACT:
 *   - the memory stores OBSERVATIONS, never recommendations
 *   - never auto-applies a pattern
 *   - never names a "winning" era or "best" pressure
 *   - FIFO-capped
 *
 * Lives at data/memory/world-model-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { WorldStateSignals } from './worldModelEngine';
import type { MeaningPressureSignals } from './meaningPressureEngine';
import type { CivilizationalEra } from './civilizationalMoodEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'world-model-memory.json';

export const WORLD_MODEL_SNAPSHOT_LIMIT = 128;

// ─── snapshot ────────────────────────────────────────────────

export interface WorldModelSnapshot {
  at: number;
  worldSignals: WorldStateSignals;
  meaningPressures: MeaningPressureSignals;
  dominantEra: CivilizationalEra;
  dominantEraConfidence: number;
  dominantWorldSignals: string[];
  dominantMeaningPressures: string[];
  dominantAestheticMigrations: string[];
  dominantAttentionMovements: string[];
  /** Total observed outcomes / fingerprints behind this snapshot. */
  observationCount: number;
}

export interface WorldModelMemoryState {
  snapshots: WorldModelSnapshot[];
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialWorldModelMemory(): WorldModelMemoryState {
  return { snapshots: [], totalSnapshots: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── pure transform ──────────────────────────────────────────

/** Append a snapshot, pure transform. */
export function appendWorldModelSnapshot(
  state: WorldModelMemoryState,
  snapshot: WorldModelSnapshot,
): WorldModelMemoryState {
  const snapshots = [...state.snapshots, snapshot].slice(-WORLD_MODEL_SNAPSHOT_LIMIT);
  return {
    ...state,
    snapshots,
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodWorldModel?: WorldModelMemoryState };

export interface WorldModelMemoryStore {
  read(): Promise<WorldModelMemoryState>;
  append(snapshot: WorldModelSnapshot): Promise<WorldModelMemoryState>;
  save(state: WorldModelMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createWorldModelMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): WorldModelMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: WorldModelMemoryStore = {
    async read() {
      if (g.__moodWorldModel) return g.__moodWorldModel;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<WorldModelMemoryState>;
        g.__moodWorldModel = { ...createInitialWorldModelMemory(), ...parsed };
      } catch {
        g.__moodWorldModel = createInitialWorldModelMemory();
      }
      return g.__moodWorldModel;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = appendWorldModelSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-WORLD_MODEL_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodWorldModel = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWorldModel = undefined;
    },
  };
  return store;
}
