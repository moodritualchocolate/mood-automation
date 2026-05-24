/**
 * CONSEQUENCE MEMORY (Wave 36)
 *
 * Persistent store of strategic-simulation results and observed
 * verb cost-maps. Lives at data/memory/consequence-memory.json.
 *
 * Two things accumulate here:
 *
 *   1. recentSimulations[] — the projected trajectory for every
 *      cognitive event (start state + three horizon endpoints +
 *      survivability). Capped FIFO. Inspectable and replayable.
 *
 *   2. verbCostMap — observed real cost per directive: average
 *      change in budget, reliability, and tension, derived from
 *      sampling actual deltas. EWMA-smoothed. The map is the
 *      organism's empirical memory of what each verb actually
 *      does over time, not what the engine claims it costs.
 *
 * No narratives, no intentions. Pure numbers.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'consequence-memory.json';
export const SIMULATION_HISTORY_LIMIT = 16;
export const COST_EWMA_ALPHA = 0.1;

/** Trajectory variables — the only ones the simulator projects.
 *  Compressed state vector; everything else is derived. */
export interface SimulatedState {
  reliability: number;          // 0..10
  budget: number;               // 0..BUDGET_MAX
  maxTension: number;           // 0..10
  fragmentationStreak: number;  // 0..N
  energy: number;               // 0..10
  stress: number;               // 0..10
  coherence: number;            // 0..10
}

export interface SimulationHorizonResult {
  horizonSteps: number;
  endState: SimulatedState;
  /** 3-point sampled trajectory: [start, mid, end] for inspection. */
  samples: SimulatedState[];
  /** 0..1 — fraction of vital indicators in healthy ranges at the end. */
  survivability: number;
  /** True when the trajectory entered a sustained-critical region
   *  (max tension > 8 or fragmentation > 6 or budget = 0) at any point. */
  enteredCritical: boolean;
}

export interface SimulationRecord {
  recordId: string;
  at: number;
  tick: number;
  directiveName: string;
  startState: SimulatedState;
  horizons: {
    short: SimulationHorizonResult;
    medium: SimulationHorizonResult;
    long: SimulationHorizonResult;
  };
}

export interface VerbCostStat {
  samples: number;
  /** EWMA of (budgetAfter - budgetBefore). Negative = consumed budget. */
  avgBudgetImpact: number;
  /** EWMA of (reliabilityAfter - reliabilityBefore). */
  avgReliabilityImpact: number;
  /** EWMA of (maxTensionAfter - maxTensionBefore). */
  avgTensionImpact: number;
  lastSampledAt: number;
}

export interface ConsequenceMemoryState {
  recentSimulations: SimulationRecord[];
  verbCostMap: Record<string, VerbCostStat>;
  /** Lifetime total simulations run. */
  totalSimulations: number;
  firstSimulatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialConsequenceMemory(): ConsequenceMemoryState {
  return {
    recentSimulations: [],
    verbCostMap: {},
    totalSimulations: 0,
    firstSimulatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodConsequence?: ConsequenceMemoryState };

export interface ConsequenceMemoryStore {
  read(): Promise<ConsequenceMemoryState>;
  save(state: ConsequenceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createConsequenceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ConsequenceMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodConsequence) return g.__moodConsequence;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodConsequence = {
          ...createInitialConsequenceMemory(),
          ...(JSON.parse(txt) as Partial<ConsequenceMemoryState>),
        };
      } catch {
        g.__moodConsequence = createInitialConsequenceMemory();
      }
      return g.__moodConsequence;
    },
    async save(state) {
      state.recentSimulations = state.recentSimulations.slice(-SIMULATION_HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodConsequence = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodConsequence = undefined;
    },
  };
}
