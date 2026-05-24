/**
 * TEMPORAL MEMORY (Wave 30 — Temporal Memory + Strategic Patience)
 *
 * Five small bounded history arrays that let the organism understand
 * its own behavior across time:
 *
 *   cadenceHistory       — inter-act gaps. detects rapid bursts and
 *                          long pauses. cap 64.
 *   recoveryHistory      — rest events with pre/post vitals. lets us
 *                          measure effectiveness over time. cap 32.
 *   approvalHistory      — approve / approve-refused outcomes with
 *                          the snapshot scores. cap 32.
 *   fragmentationHistory — fragmentation peaks and how they resolved.
 *                          cap 32.
 *   deferHistory         — every defer event with its named reason.
 *                          cap 32.
 *
 * Lives at data/memory/temporal-memory.json — long-term operational
 * memory, separate from os/runtime (transient state) and
 * cognitive-lineage (structured artifacts). Every observation is
 * deterministic — composed at the moment of the cognitive event from
 * persisted state, never invented.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'temporal-memory.json';

export const CADENCE_LIMIT = 64;
export const RECOVERY_LIMIT = 32;
export const APPROVAL_LIMIT = 32;
export const FRAGMENTATION_LIMIT = 32;
export const DEFER_LIMIT = 32;

export interface CadenceObservation {
  at: number;
  tick: number;
  directive: string;
  /** ms since the previous observation, or null on first ever. */
  interActMs: number | null;
  /** ticks since the previous observation, or null on first. */
  interActTicks: number | null;
}

export interface RecoveryObservation {
  at: number;
  tick: number;
  beforeEnergy: number;
  afterEnergy: number;
  beforeStress: number;
  afterStress: number;
  beforeComplexity: number;
  afterComplexity: number;
  /** 0..1 — how much of the max possible recovery this rest actually
   *  achieved. Computed from the magnitude of the deltas relative to
   *  the spec's max delta size. */
  effectiveness: number;
}

export interface ApprovalObservation {
  at: number;
  tick: number;
  outcome: 'approved' | 'refused';
  qualityScore?: number;
  coherenceScore?: number;
  restraintScore?: number;
  contradictionScore?: number;
}

export interface FragmentationObservation {
  at: number;
  tick: number;
  /** The peak streak just before this resolution. */
  peakStreak: number;
  /** How fragmentation resolved. 'success' = a non-refused cognitive
   *  act reset the streak (the only path Wave 30 tracks; metabolism
   *  resolution stays untracked). */
  resolvedBy: 'success';
}

export interface DeferObservation {
  at: number;
  tick: number;
  reason: string;
  cadenceHealthAtDefer: number;
  fragmentationRiskAtDefer: number;
}

export interface TemporalMemoryState {
  cadenceHistory: CadenceObservation[];
  recoveryHistory: RecoveryObservation[];
  approvalHistory: ApprovalObservation[];
  fragmentationHistory: FragmentationObservation[];
  deferHistory: DeferObservation[];
  totalDefers: number;
  firstObservationAt: number | null;
  lastObservationAt: number | null;
  updatedAt: number;
}

export function createInitialTemporalMemory(): TemporalMemoryState {
  return {
    cadenceHistory: [],
    recoveryHistory: [],
    approvalHistory: [],
    fragmentationHistory: [],
    deferHistory: [],
    totalDefers: 0,
    firstObservationAt: null,
    lastObservationAt: null,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodTemporalMemory?: TemporalMemoryState };

export interface TemporalMemoryStore {
  read(): Promise<TemporalMemoryState>;
  save(state: TemporalMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createTemporalMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): TemporalMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodTemporalMemory) return g.__moodTemporalMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodTemporalMemory = {
          ...createInitialTemporalMemory(),
          ...(JSON.parse(txt) as Partial<TemporalMemoryState>),
        };
      } catch {
        g.__moodTemporalMemory = createInitialTemporalMemory();
      }
      return g.__moodTemporalMemory;
    },
    async save(state) {
      // Enforce caps on write (defensive — appends should already cap).
      state.cadenceHistory = state.cadenceHistory.slice(-CADENCE_LIMIT);
      state.recoveryHistory = state.recoveryHistory.slice(-RECOVERY_LIMIT);
      state.approvalHistory = state.approvalHistory.slice(-APPROVAL_LIMIT);
      state.fragmentationHistory = state.fragmentationHistory.slice(-FRAGMENTATION_LIMIT);
      state.deferHistory = state.deferHistory.slice(-DEFER_LIMIT);
      state.updatedAt = Date.now();
      g.__moodTemporalMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodTemporalMemory = undefined;
    },
  };
}
