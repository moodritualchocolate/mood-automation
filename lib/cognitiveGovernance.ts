/**
 * COGNITIVE GOVERNANCE (Wave 35)
 *
 * Persistent executive-regulation memory. The store does not decide
 * what cognition should do — it tracks deterministic permission
 * gradients (0..1) that other layers may consult when computing
 * their own thresholds. Soft throttling only: no verb is ever
 * blocked by governance; verbs operate against governed thresholds
 * that have been biased away from aggressive behavior when trust /
 * budget / forecast warrant it.
 *
 * Lives at data/memory/cognitive-governance.json. History capped
 * at HISTORY_LIMIT (64) FIFO.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'cognitive-governance.json';
export const HISTORY_LIMIT = 64;

/** Discrete operational-trust zones. Promotion / demotion is
 *  hysteresis-banded (see governanceEngine.trustZoneTransition). */
export type TrustZone = 'high-trust' | 'watchful' | 'restricted' | 'suspended';

/** Six permission gradients (0..1) the rest of the system may read.
 *  1.0 = neutral / full permission, 0.0 = maximum restriction. */
export interface RegulationGradients {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  /** Bias toward accepting defer recommendations. 1 = freely accept. */
  deferAcceptance: number;
  /** Bias toward rest. 1 = max push toward rest. */
  recoveryWeighting: number;
  burstTolerance: number;
}

export const NEUTRAL_GRADIENTS: RegulationGradients = {
  cognitionThroughput: 1,
  escalationPermission: 1,
  explorationIntensity: 1,
  deferAcceptance: 0.5,
  recoveryWeighting: 0.5,
  burstTolerance: 1,
};

/** Cognitive budget — a real countable resource. Each verb costs a
 *  fixed amount; rest replenishes it. Budget never hard-blocks: when
 *  depleted, the recovery gradient is pushed up, which makes rest
 *  thresholds fire earlier and defer thresholds easier to recommend. */
export const BUDGET_MAX = 50;

export interface CognitiveBudget {
  current: number;          // 0..BUDGET_MAX
  max: number;              // BUDGET_MAX
  consumedTotal: number;    // lifetime sum of consumption
  replenishedTotal: number; // lifetime sum of replenishment
  lastConsumedAt: number | null;
  lastReplenishedAt: number | null;
}

export interface InstabilityForecast {
  computedAt: number;
  computedTick: number;
  currentReliability: number;
  reliabilitySlope: number;
  /** Reliability projected horizonEvents forward via linear fit. */
  projectedReliability: number;
  projectedZone: TrustZone;
  horizonEvents: number;
}

export interface DecisionRecord {
  at: number;
  tick: number;
  kind: 'zone-transition' | 'budget-warning' | 'forecast-warning' | 'gradient-shift';
  fromZone?: TrustZone;
  toZone?: TrustZone;
  reason: string;
}

/** Wave 35 — dense per-event reliability sample. Governance samples
 *  the meta-cognitive cumulativeReliabilityScore on every update so
 *  the forecast has data even when no individual meta-cognitive
 *  observation has cleared its delta threshold. Capped FIFO. */
export interface ReliabilitySample {
  at: number;
  tick: number;
  score: number;
}

export const RELIABILITY_SAMPLES_LIMIT = 16;

export interface CognitiveGovernanceState {
  zone: TrustZone;
  budget: CognitiveBudget;
  gradients: RegulationGradients;
  forecast: InstabilityForecast | null;
  decisionHistory: DecisionRecord[];
  reliabilitySamples: ReliabilitySample[];
  /** Lifetime count of zone transitions (any direction). */
  zoneTransitions: number;
  /** Lifetime count of governance events that pushed a gradient by
   *  more than GRADIENT_SHIFT_THRESHOLD compared to the previous tick. */
  significantShifts: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialGovernance(): CognitiveGovernanceState {
  return {
    zone: 'high-trust',
    budget: {
      current: BUDGET_MAX,
      max: BUDGET_MAX,
      consumedTotal: 0,
      replenishedTotal: 0,
      lastConsumedAt: null,
      lastReplenishedAt: null,
    },
    gradients: { ...NEUTRAL_GRADIENTS },
    forecast: null,
    decisionHistory: [],
    reliabilitySamples: [],
    zoneTransitions: 0,
    significantShifts: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodGovernance?: CognitiveGovernanceState };

export interface CognitiveGovernanceStore {
  read(): Promise<CognitiveGovernanceState>;
  save(state: CognitiveGovernanceState): Promise<void>;
  reset(): Promise<void>;
}

export function createCognitiveGovernanceStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CognitiveGovernanceStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodGovernance) return g.__moodGovernance;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodGovernance = {
          ...createInitialGovernance(),
          ...(JSON.parse(txt) as Partial<CognitiveGovernanceState>),
        };
      } catch {
        g.__moodGovernance = createInitialGovernance();
      }
      return g.__moodGovernance;
    },
    async save(state) {
      state.decisionHistory = state.decisionHistory.slice(-HISTORY_LIMIT);
      state.reliabilitySamples = state.reliabilitySamples.slice(-RELIABILITY_SAMPLES_LIMIT);
      state.updatedAt = nowMs();
      g.__moodGovernance = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodGovernance = undefined;
    },
  };
}
