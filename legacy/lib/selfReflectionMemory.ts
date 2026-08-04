/**
 * SELF REFLECTION MEMORY (FIFO, append-only)
 *
 * Persistent FIFO of REFLECTIVE SNAPSHOTS. Each entry is a passive
 * observation of the system's own degradation / drift / repetition /
 * authenticity / fatigue / trust-erosion signals at a moment in time.
 *
 * STRICT CONTRACT:
 *   - the memory stores OBSERVATIONS, never recommendations
 *   - no execution history (the system never executes anything based
 *     on reflection)
 *   - never names a "winner" or "best" output
 *   - FIFO-capped
 *
 * Lives at data/memory/self-reflection-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { MetaCognitionSignals } from './metaCognitionEngine';
import type { IdentityDriftSignals, DriftVerdict } from './identityDriftEngine';
import type { AestheticCollapseSignals, CollapseVerdict } from './aestheticCollapseEngine';
import type { HumanityRetentionSignals, HumanityVerdict } from './humanityRetentionEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'self-reflection-memory.json';

export const SELF_REFLECTION_SNAPSHOT_LIMIT = 128;

// ─── snapshot ────────────────────────────────────────────────

export interface SelfReflectionSnapshot {
  at: number;
  /** 15 degradation signals from metaCognitionEngine. */
  metaSignals: MetaCognitionSignals;
  dominantDegradations: string[];
  /** 9 identity drift signals + verdict. */
  identitySignals: IdentityDriftSignals;
  identityVerdict: DriftVerdict;
  identityDriftIndex: number;
  /** 8 aesthetic collapse signals + verdict. */
  aestheticCollapseLevels: Record<keyof AestheticCollapseSignals, number>;
  aestheticVerdict: CollapseVerdict;
  aestheticCollapseIndex: number;
  /** Humanity retention reading. */
  humanitySignals: HumanityRetentionSignals;
  humanityVerdict: HumanityVerdict;
  humanityIndex: number;
  /** Combined observation count behind the snapshot. */
  observationCount: number;
}

export interface SelfReflectionMemoryState {
  snapshots: SelfReflectionSnapshot[];
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialSelfReflectionMemory(): SelfReflectionMemoryState {
  return { snapshots: [], totalSnapshots: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── pure transform ──────────────────────────────────────────

export function appendSelfReflectionSnapshot(
  state: SelfReflectionMemoryState,
  snapshot: SelfReflectionSnapshot,
): SelfReflectionMemoryState {
  const snapshots = [...state.snapshots, snapshot].slice(-SELF_REFLECTION_SNAPSHOT_LIMIT);
  return {
    ...state,
    snapshots,
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodSelfReflection?: SelfReflectionMemoryState };

export interface SelfReflectionMemoryStore {
  read(): Promise<SelfReflectionMemoryState>;
  append(snapshot: SelfReflectionSnapshot): Promise<SelfReflectionMemoryState>;
  save(state: SelfReflectionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createSelfReflectionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): SelfReflectionMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: SelfReflectionMemoryStore = {
    async read() {
      if (g.__moodSelfReflection) return g.__moodSelfReflection;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<SelfReflectionMemoryState>;
        g.__moodSelfReflection = { ...createInitialSelfReflectionMemory(), ...parsed };
      } catch {
        g.__moodSelfReflection = createInitialSelfReflectionMemory();
      }
      return g.__moodSelfReflection;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = appendSelfReflectionSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-SELF_REFLECTION_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodSelfReflection = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodSelfReflection = undefined;
    },
  };
  return store;
}
