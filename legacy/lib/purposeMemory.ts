/**
 * PURPOSE MEMORY (Wave 31 — Purpose / Intent Layer)
 *
 * Persistent goal state + activation/drift/alignment/fatigue history.
 * Goals are NOT tasks — they are directional pressures the organism
 * carries across time. Every goal seeded in createInitialPurposeMemory()
 * represents an internal-coherence concern (the user's examples).
 *
 * Lives at data/memory/purpose-memory.json — long-term operational
 * identity, separate from temporal-memory (longitudinal observations)
 * and cognitive-lineage (structured artifacts).
 *
 * Each history array is capped at HISTORY_LIMIT (32) with FIFO
 * eviction. Observations are recorded only when the underlying score
 * CHANGES by at least HISTORY_DELTA_THRESHOLD (0.3) — keeps the
 * arrays meaningful rather than noisy.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'purpose-memory.json';
export const HISTORY_LIMIT = 32;
export const HISTORY_DELTA_THRESHOLD = 0.3;

export type GoalIntentType =
  | 'coherence' | 'discipline' | 'cadence' | 'recovery' | 'continuity';

export type GoalActivationState =
  | 'emerging' | 'active' | 'dormant' | 'fragmented' | 'abandoned' | 'resolved';

export interface Goal {
  id: string;
  title: string;
  intentType: GoalIntentType;
  /** 0..10 — strength of the directional pressure relative to others. */
  priority: number;
  /** 0..10 — how strongly this goal coheres internally right now.
   *  derived metric, updated alongside align/drift. */
  coherenceWeight: number;
  activationState: GoalActivationState;
  createdAt: number;
  lastActivatedAt: number;
  /** 0..10 — pressure away from this goal. Rises with contradicting
   *  cognition; drifts down slowly otherwise. */
  driftScore: number;
  /** 0..10 — accumulated effort against this goal. Rises with every
   *  cognitive event affecting it; drops with rest and hibernation. */
  fatigueScore: number;
  /** 0..10 — derived from driftScore + fatigueScore + time-since-
   *  activation. ≥ 8 triggers fragmented → abandoned transition. */
  abandonmentRisk: number;
  /** 0..10 — how well cognition has been honoring this goal recently. */
  alignmentScore: number;
  /** 0..10 — composite of priority × alignment, scaled. */
  pressureScore: number;
  /** Os.uptime tick at which the most recent score-affecting event
   *  fired. Used for active → dormant transition. */
  lastRelevantTick: number;
}

export interface ActivationTransitionRecord {
  at: number;
  tick: number;
  goalId: string;
  goalTitle: string;
  from: GoalActivationState;
  to: GoalActivationState;
  reason: string;
}

export interface ScoreObservation {
  at: number;
  tick: number;
  goalId: string;
  value: number;
  delta: number;
}

export interface PurposeMemoryState {
  goals: Goal[];
  activationTransitions: ActivationTransitionRecord[];
  driftHistory: ScoreObservation[];
  alignmentHistory: ScoreObservation[];
  fatigueHistory: ScoreObservation[];
  /** Periodic snapshots of overall purpose state — one per cognitive
   *  event, kept slim (counts only). */
  goalSnapshotHistory: Array<{
    at: number;
    tick: number;
    activeCount: number;
    fragmentedCount: number;
    dormantCount: number;
    abandonedCount: number;
  }>;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  lastUpdatedAt: number;
}

function nowMs(): number { return Date.now(); }

/**
 * Seed five canonical internal-coherence goals — the user's spec
 * examples. They begin in 'emerging' state with baseline mid-scores
 * and become 'active' only after the organism's cognition supports
 * them consistently.
 */
function seedGoals(): Goal[] {
  const at = nowMs();
  const mk = (
    id: string, title: string, intentType: GoalIntentType, priority: number,
  ): Goal => ({
    id, title, intentType, priority,
    coherenceWeight: 5,
    activationState: 'emerging',
    createdAt: at,
    lastActivatedAt: at,
    driftScore: 0,
    fatigueScore: 0,
    abandonmentRisk: 0,
    alignmentScore: 3,
    pressureScore: priority * 0.3,
    lastRelevantTick: 0,
  });
  return [
    mk('goal-coherence',     'maintain coherence',            'coherence',  8),
    mk('goal-anti-fragment', 'reduce fragmentation',          'discipline', 7),
    mk('goal-cadence',       'stabilize cognition cadence',   'cadence',    6),
    mk('goal-recovery',      'preserve recovery rhythm',      'recovery',   6),
    mk('goal-continuity',    'protect strategic continuity',  'continuity', 7),
  ];
}

export function createInitialPurposeMemory(): PurposeMemoryState {
  return {
    goals: seedGoals(),
    activationTransitions: [],
    driftHistory: [],
    alignmentHistory: [],
    fatigueHistory: [],
    goalSnapshotHistory: [],
    totalUpdates: 0,
    firstUpdatedAt: null,
    lastUpdatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodPurposeMemory?: PurposeMemoryState };

export interface PurposeMemoryStore {
  read(): Promise<PurposeMemoryState>;
  save(state: PurposeMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createPurposeMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): PurposeMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodPurposeMemory) return g.__moodPurposeMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<PurposeMemoryState>;
        g.__moodPurposeMemory = {
          ...createInitialPurposeMemory(),
          ...parsed,
          // If parsed.goals is missing or empty, fall back to seeds.
          goals: parsed.goals && parsed.goals.length > 0
            ? parsed.goals
            : seedGoals(),
        };
      } catch {
        g.__moodPurposeMemory = createInitialPurposeMemory();
      }
      return g.__moodPurposeMemory;
    },
    async save(state) {
      state.activationTransitions = state.activationTransitions.slice(-HISTORY_LIMIT);
      state.driftHistory = state.driftHistory.slice(-HISTORY_LIMIT);
      state.alignmentHistory = state.alignmentHistory.slice(-HISTORY_LIMIT);
      state.fatigueHistory = state.fatigueHistory.slice(-HISTORY_LIMIT);
      state.goalSnapshotHistory = state.goalSnapshotHistory.slice(-HISTORY_LIMIT);
      state.lastUpdatedAt = nowMs();
      g.__moodPurposeMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPurposeMemory = undefined;
    },
  };
}
