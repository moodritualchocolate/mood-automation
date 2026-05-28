/**
 * MEMORY IMPRINT MEMORY (FIFO, append-only)
 *
 * Persistent FIFO of HUMAN MEMORY IMPRINT SNAPSHOTS. Each entry is a
 * passive observation of imprint / scar / ritual persistence /
 * silence weight / mythic narrative signals at a moment in time.
 *
 * STRICT CONTRACT:
 *   - the memory stores OBSERVATIONS only — never recommendations
 *   - never auto-applies anything
 *   - never names a "winning" archetype, ritual, or imprint signal
 *   - FIFO-capped
 *
 * Lives at data/memory/memory-imprint-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { RememberedMomentSignals } from './humanMemoryImprintEngine';
import type { EmotionalScarSignals, ScarVerdict } from './emotionalScarEngine';
import type { SilenceWeightSignals } from './silenceWeightEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'memory-imprint-memory.json';

export const MEMORY_IMPRINT_SNAPSHOT_LIMIT = 128;

// ─── snapshot ────────────────────────────────────────────────

export interface MemoryImprintSnapshot {
  at: number;
  /** Composite imprint strength 0..10. */
  imprintStrength: number;
  /** 16 remembered moment signals. */
  imprintSignals: RememberedMomentSignals;
  dominantImprintSignals: string[];
  /** Memory risk signal 0..10. */
  memoryRisk: number;
  /** Emotional scar verdict + signals. */
  scarVerdict: ScarVerdict;
  scarSignals: EmotionalScarSignals;
  /** Per-ritual persistence values 0..10. */
  ritualPersistence: Record<string, number>;
  dominantRituals: string[];
  /** Silence weight composite + signals. */
  silenceWeightIndex: number;
  silenceSignals: SilenceWeightSignals;
  /** Mythic archetype weights 0..10. */
  mythicWeights: Record<string, number>;
  overallMythicWeight: number;
  dominantArchetypes: string[];
  /** Combined observation count behind the snapshot. */
  observationCount: number;
}

export interface MemoryImprintMemoryState {
  snapshots: MemoryImprintSnapshot[];
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialMemoryImprintMemory(): MemoryImprintMemoryState {
  return { snapshots: [], totalSnapshots: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── pure transform ──────────────────────────────────────────

export function appendMemoryImprintSnapshot(
  state: MemoryImprintMemoryState,
  snapshot: MemoryImprintSnapshot,
): MemoryImprintMemoryState {
  const snapshots = [...state.snapshots, snapshot].slice(-MEMORY_IMPRINT_SNAPSHOT_LIMIT);
  return {
    ...state,
    snapshots,
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodMemoryImprint?: MemoryImprintMemoryState };

export interface MemoryImprintMemoryStore {
  read(): Promise<MemoryImprintMemoryState>;
  append(snapshot: MemoryImprintSnapshot): Promise<MemoryImprintMemoryState>;
  save(state: MemoryImprintMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createMemoryImprintMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MemoryImprintMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: MemoryImprintMemoryStore = {
    async read() {
      if (g.__moodMemoryImprint) return g.__moodMemoryImprint;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<MemoryImprintMemoryState>;
        g.__moodMemoryImprint = { ...createInitialMemoryImprintMemory(), ...parsed };
      } catch {
        g.__moodMemoryImprint = createInitialMemoryImprintMemory();
      }
      return g.__moodMemoryImprint;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = appendMemoryImprintSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-MEMORY_IMPRINT_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodMemoryImprint = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMemoryImprint = undefined;
    },
  };
  return store;
}
