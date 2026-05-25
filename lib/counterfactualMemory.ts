/**
 * COUNTERFACTUAL MEMORY (Wave 43)
 *
 * Persistent counterfactual civilization analysis. Every major
 * cognitive event the engine runs the actual trajectory PLUS
 * seven alternative deterministic strategy branches from the same
 * post-event state, compares end-states across +5/+20/+50 horizons,
 * accumulates regret pressure for strategies that consistently
 * outperform actual, logs missed opportunities + false recoveries,
 * and emits a CounterfactualBias for the next event's governance.
 *
 * NOT imagination. NOT story. Pure deterministic alternate
 * civilization analysis. Same history → same branches / regrets.
 *
 * Lives at data/memory/counterfactual-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { SimulatedState } from './consequenceMemory';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'counterfactual-memory.json';

export const BRANCH_RESULT_HISTORY_LIMIT = 16;
export const REGRET_OBSERVATION_LIMIT = 24;
export const MISSED_OPPORTUNITY_LIMIT = 24;
export const FALSE_RECOVERY_LIMIT = 24;
export const RANKING_HISTORY_LIMIT = 24;
export const TRANSITION_HISTORY_LIMIT = 24;

export type StrategyId =
  | 'actual'
  | 'conservative'
  | 'aggressive'
  | 'recovery-heavy'
  | 'continuity-first'
  | 'mutation-first'
  | 'governance-restrictive'
  | 'exploration-heavy';

export interface StrategyHorizonProjection {
  horizon: number;             // 5 | 20 | 50
  endState: SimulatedState;
  survivability: number;       // 0..1
  enteredCritical: boolean;
}

export interface StrategyBranchResult {
  strategyId: StrategyId;
  parentTick: number;
  startState: SimulatedState;
  horizons: {
    short: StrategyHorizonProjection;
    medium: StrategyHorizonProjection;
    long: StrategyHorizonProjection;
  };
  /** Composite ranking 0..10 — used for relative ordering. */
  compositeScore: number;
}

export interface RegretObservation {
  at: number;
  tick: number;
  alternateStrategy: StrategyId;
  survivabilityDelta: number;
  continuityDelta: number;
  efficiencyDelta: number;
}

export interface RegretRecord {
  /** Strategy that has consistently outperformed actual. */
  strategyId: StrategyId;
  /** EWMA-smoothed survivability advantage of strategy over actual. */
  survivabilityDelta: number;
  /** EWMA-smoothed continuity / resource advantage. */
  continuityDelta: number;
  /** EWMA-smoothed efficiency advantage (lower collapse risk). */
  efficiencyDelta: number;
  /** 0..1 — how confidently this strategy is "better" than actual. */
  recurrenceConfidence: number;
  /** Cumulative regret pressure (decays slowly when strategy stops outperforming). */
  accumulatedPressure: number;
  /** Lifetime samples. */
  observationCount: number;
  /** Latest tick of observation. */
  lastObservedTick: number;
}

export interface MissedOpportunity {
  at: number;
  tick: number;
  alternateStrategy: StrategyId;
  /** What collapse would have been avoided in the alternate branch. */
  avoidedCollapseRisk: number;
  /** Actual long-horizon survivability. */
  actualLongSurvivability: number;
  /** Alternate's long-horizon survivability. */
  alternateLongSurvivability: number;
}

export interface FalseRecovery {
  at: number;
  tick: number;
  /** strategyId that looked successful short-term. */
  strategyId: StrategyId;
  shortHorizonSurvivability: number;
  longHorizonSurvivability: number;
  /** How much it degraded between horizons. */
  degradationDelta: number;
}

export type CivilizationStrategicState =
  | 'reactive'
  | 'adaptive'
  | 'historically-aware'
  | 'regret-conditioned'
  | 'strategically-dissatisfied'
  | 'trajectory-sensitive'
  | 'continuity-optimized'
  | 'over-conservative'
  | 'evolution-seeking';

export interface StrategicStateTransition {
  at: number;
  tick: number;
  from: CivilizationStrategicState;
  to: CivilizationStrategicState;
  reason: string;
}

export interface TimelineRanking {
  at: number;
  tick: number;
  /** Strategy IDs in descending compositeScore order. */
  ranking: StrategyId[];
  /** Best strategy's composite score this event. */
  topScore: number;
  /** Whether actual was the top-ranked strategy. */
  actualWasTop: boolean;
}

export interface CounterfactualMemoryState {
  /** Most-recent branch results (one set per event). FIFO-capped. */
  recentBranches: StrategyBranchResult[][];
  /** Per-strategy regret tracking. */
  regrets: Record<StrategyId, RegretRecord>;
  /** Recent observed regret samples. */
  regretObservations: RegretObservation[];
  /** Logged missed opportunities. */
  missedOpportunities: MissedOpportunity[];
  /** Logged false recoveries. */
  falseRecoveries: FalseRecovery[];
  /** Timeline rankings over time. */
  rankings: TimelineRanking[];
  /** Lifetime count of events where actual was NOT the top-ranked branch. */
  actualUnderperformanceCount: number;
  /** Lifetime count of total comparisons. */
  totalComparisons: number;
  /** Current strategic state with hysteresis persistence. */
  strategicState: CivilizationStrategicState;
  statePersistenceTicks: number;
  transitions: StrategicStateTransition[];
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

const ALL_STRATEGIES: StrategyId[] = [
  'actual', 'conservative', 'aggressive', 'recovery-heavy',
  'continuity-first', 'mutation-first', 'governance-restrictive',
  'exploration-heavy',
];

function emptyRegret(strategyId: StrategyId): RegretRecord {
  return {
    strategyId,
    survivabilityDelta: 0,
    continuityDelta: 0,
    efficiencyDelta: 0,
    recurrenceConfidence: 0,
    accumulatedPressure: 0,
    observationCount: 0,
    lastObservedTick: 0,
  };
}

export function createInitialCounterfactualMemory(): CounterfactualMemoryState {
  const regrets: Record<StrategyId, RegretRecord> = {} as Record<StrategyId, RegretRecord>;
  for (const s of ALL_STRATEGIES) regrets[s] = emptyRegret(s);
  return {
    recentBranches: [],
    regrets,
    regretObservations: [],
    missedOpportunities: [],
    falseRecoveries: [],
    rankings: [],
    actualUnderperformanceCount: 0,
    totalComparisons: 0,
    strategicState: 'reactive',
    statePersistenceTicks: 0,
    transitions: [],
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodCounterfactual?: CounterfactualMemoryState };

export interface CounterfactualMemoryStore {
  read(): Promise<CounterfactualMemoryState>;
  save(state: CounterfactualMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCounterfactualMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CounterfactualMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodCounterfactual) return g.__moodCounterfactual;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodCounterfactual = {
          ...createInitialCounterfactualMemory(),
          ...(JSON.parse(txt) as Partial<CounterfactualMemoryState>),
        };
      } catch {
        g.__moodCounterfactual = createInitialCounterfactualMemory();
      }
      return g.__moodCounterfactual;
    },
    async save(state) {
      state.recentBranches = state.recentBranches.slice(-BRANCH_RESULT_HISTORY_LIMIT);
      state.regretObservations = state.regretObservations.slice(-REGRET_OBSERVATION_LIMIT);
      state.missedOpportunities = state.missedOpportunities.slice(-MISSED_OPPORTUNITY_LIMIT);
      state.falseRecoveries = state.falseRecoveries.slice(-FALSE_RECOVERY_LIMIT);
      state.rankings = state.rankings.slice(-RANKING_HISTORY_LIMIT);
      state.transitions = state.transitions.slice(-TRANSITION_HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCounterfactual = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCounterfactual = undefined;
    },
  };
}
