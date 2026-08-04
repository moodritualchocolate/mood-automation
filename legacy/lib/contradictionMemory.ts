/**
 * CONTRADICTION MEMORY (Wave 32 — Contradiction Engine)
 *
 * Persistent pressure-topology archive. Tension is not feeling; it
 * is the measurable incompatibility between an active goal and a
 * derived pressure level that opposes it.
 *
 * Lives at data/memory/contradiction-memory.json. Five seeded tension
 * pairs match the user's spec. Each pair carries a fixed tensionWeight
 * (the priority of the conflict), escalationRate (how fast tension
 * climbs under pressure), and recoveryRate (how slowly tension falls
 * when pressure subsides). Asymmetric rates create the "easy to
 * enter, harder to recover" hysteresis the user required.
 *
 * Each history array capped at HISTORY_LIMIT (32), FIFO. Events
 * recorded only when tension MOVES by ≥ HISTORY_DELTA_THRESHOLD
 * (0.3) — keeps the arrays meaningful, not noisy.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'contradiction-memory.json';
export const HISTORY_LIMIT = 32;
export const HISTORY_DELTA_THRESHOLD = 0.3;

/** Identifiers for derived pressure quantities. Each is computed
 *  deterministically by contradictionEngine.computePressureLevels()
 *  from current temporal/organism/os state. Pressures are NOT stored;
 *  only their effect on tension is. */
export type OpposingPressureId =
  | 'cognition-throughput'
  | 'sustained-rapid-cognition'
  | 'high-exploration-density'
  | 'fragmentation-escalation'
  | 'aggressive-throughput';

export interface TensionPair {
  pairId: string;
  goalAId: string;
  goalATitle: string;
  opposingPressureId: OpposingPressureId;
  opposingPressureLabel: string;
  /** 0..10 fixed — the priority of this conflict if it materializes. */
  tensionWeight: number;
  /** How much tension rises per cognitive event when conditions match. */
  escalationRate: number;
  /** How much tension falls per cognitive event when pressure has truly
   *  subsided (only fires when pressureLevel ≤ 3). */
  recoveryRate: number;
  // ─── live state ───────────────────────────────────────────────
  /** 0..10 — current tension. */
  tensionScore: number;
  /** Updates above 8 in a row. ≥ 3 triggers sacrifice. */
  sustainedHighCount: number;
  /** Max tensionScore ever reached for this pair. Used for dominant
   *  conflict surfacing. */
  peakTension: number;
  lastUpdateAt: number;
  lastUpdateTick: number;
}

export interface ContradictionEvent {
  at: number;
  tick: number;
  pairId: string;
  tensionScore: number;
  delta: number;
  cause: 'escalation' | 'recovery' | 'sacrifice-resolution';
}

export interface ResolvedTensionEvent {
  at: number;
  tick: number;
  pairId: string;
  finalScore: number;
  resolvedFromPeak: number;
}

export interface SacrificeEvent {
  at: number;
  tick: number;
  goalId: string;
  goalTitle: string;
  from: string;
  to: string;
  pairId: string;
  tensionAtSacrifice: number;
  opposingPressureLabel: string;
}

export interface ContradictionMemoryState {
  pairs: TensionPair[];
  contradictionHistory: ContradictionEvent[];
  resolvedTensions: ResolvedTensionEvent[];
  sacrifices: SacrificeEvent[];
  /** count of tension events that touched each goal id. */
  contradictionCountsByGoal: Record<string, number>;
  /** monotonic — sum of all positive tension deltas ever observed. */
  cumulativeSystemTension: number;
  lastResolutionAt: number | null;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

/**
 * Seed the five tension pairs the user specified. tensionWeight,
 * escalationRate, recoveryRate are FIXED constants — the conflict
 * topology of the runtime, not learned.
 *
 * Note: opposingPressureLabel uses the user's exact spec wording.
 */
function seedPairs(): TensionPair[] {
  const at = nowMs();
  const mk = (
    pairId: string,
    goalAId: string, goalATitle: string,
    opposingPressureId: OpposingPressureId, opposingPressureLabel: string,
    tensionWeight: number, escalationRate: number, recoveryRate: number,
  ): TensionPair => ({
    pairId,
    goalAId, goalATitle,
    opposingPressureId, opposingPressureLabel,
    tensionWeight, escalationRate, recoveryRate,
    tensionScore: 0,
    sustainedHighCount: 0,
    peakTension: 0,
    lastUpdateAt: at,
    lastUpdateTick: 0,
  });
  return [
    mk('coherence-vs-throughput',
       'goal-coherence', 'maintain coherence',
       'cognition-throughput', 'maximize cognition throughput',
       8, 0.5, 0.2),
    mk('recovery-vs-rapid',
       'goal-recovery', 'preserve recovery rhythm',
       'sustained-rapid-cognition', 'sustained rapid cognition',
       7, 0.6, 0.3),
    mk('cadence-vs-density',
       'goal-cadence', 'stabilize cognition cadence',
       'high-exploration-density', 'high exploration density',
       7, 0.5, 0.25),
    mk('continuity-vs-fragmentation',
       'goal-continuity', 'protect strategic continuity',
       'fragmentation-escalation', 'fragmentation escalation',
       8, 0.6, 0.2),
    mk('anti-fragment-vs-throughput',
       'goal-anti-fragment', 'reduce fragmentation',
       'aggressive-throughput', 'aggressive throughput',
       7, 0.5, 0.25),
  ];
}

export function createInitialContradictionMemory(): ContradictionMemoryState {
  return {
    pairs: seedPairs(),
    contradictionHistory: [],
    resolvedTensions: [],
    sacrifices: [],
    contradictionCountsByGoal: {},
    cumulativeSystemTension: 0,
    lastResolutionAt: null,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodContradictionMemory?: ContradictionMemoryState };

export interface ContradictionMemoryStore {
  read(): Promise<ContradictionMemoryState>;
  save(state: ContradictionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createContradictionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ContradictionMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodContradictionMemory) return g.__moodContradictionMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<ContradictionMemoryState>;
        g.__moodContradictionMemory = {
          ...createInitialContradictionMemory(),
          ...parsed,
          pairs: parsed.pairs && parsed.pairs.length > 0
            ? parsed.pairs
            : seedPairs(),
        };
      } catch {
        g.__moodContradictionMemory = createInitialContradictionMemory();
      }
      return g.__moodContradictionMemory;
    },
    async save(state) {
      state.contradictionHistory = state.contradictionHistory.slice(-HISTORY_LIMIT);
      state.resolvedTensions = state.resolvedTensions.slice(-HISTORY_LIMIT);
      state.sacrifices = state.sacrifices.slice(-HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodContradictionMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodContradictionMemory = undefined;
    },
  };
}
