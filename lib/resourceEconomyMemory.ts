/**
 * RESOURCE ECONOMY MEMORY (Wave 38)
 *
 * Seven independent operational resources, each 0..100. Every
 * cognitive event consumes / restores / damages them. Costs are
 * NOT static — they scale with ecology state, governance zone,
 * contradiction tension, current scarcity. Recovery is asymmetric
 * and dependent on ecological dominance.
 *
 * This is NOT mood simulation. It is operational metabolism.
 * The organism pays for cognition.
 *
 * Lives at data/memory/resource-economy.json. Histories FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'resource-economy.json';
export const HISTORY_LIMIT = 64;
export const FLOW_HISTORY_LIMIT = 24;

export type ResourceId =
  | 'cognitiveEnergy'        // capacity for sustained cognition
  | 'coherenceReserve'       // ability to absorb contradiction safely
  | 'recoveryReserve'        // future restoration capacity
  | 'explorationCapital'     // novelty / experimentation tolerance
  | 'strategicStability'     // long-horizon survivability integrity
  | 'contradictionCapacity'  // unresolved tension safely tolerated
  | 'executionLiquidity';    // throughput sustainability

export const ALL_RESOURCES: ResourceId[] = [
  'cognitiveEnergy', 'coherenceReserve', 'recoveryReserve',
  'explorationCapital', 'strategicStability', 'contradictionCapacity',
  'executionLiquidity',
];

export const RESOURCE_MAX = 100;

/** Natural "homeostatic" target each resource drifts toward at rest. */
export const RESOURCE_BASELINES: Record<ResourceId, number> = {
  cognitiveEnergy:       55,
  coherenceReserve:      60,
  recoveryReserve:       50,
  explorationCapital:    50,
  strategicStability:    65,
  contradictionCapacity: 60,
  executionLiquidity:    55,
};

export interface ResourceLevels {
  cognitiveEnergy: number;
  coherenceReserve: number;
  recoveryReserve: number;
  explorationCapital: number;
  strategicStability: number;
  contradictionCapacity: number;
  executionLiquidity: number;
}

export interface ResourceFlow {
  /** Delta this event applied (post-multiplier). */
  lastDelta: number;
  /** EWMA-smoothed signed rate. Positive = restoring, negative = burning. */
  emaRate: number;
  /** EWMA-smoothed absolute burn rate (negative deltas only). */
  burnRate: number;
  /** EWMA-smoothed restoration rate (positive deltas only). */
  restoreRate: number;
}

export interface ResourceObservation {
  at: number;
  tick: number;
  resource: ResourceId;
  level: number;
  delta: number;
}

export type CollapseState =
  | 'healthy'
  | 'depleted'
  | 'overextended'
  | 'contradiction-fragile'
  | 'starvation-risk'
  | 'recovery-locked'
  | 'exploration-bankrupt'
  | 'liquidity-collapse';

export type EcologySpeciesId = 'explorer' | 'conservator' | 'optimizer' | 'guardian';

export interface SpeciesAllocation {
  speciesId: EcologySpeciesId;
  /** Composite numeric desire 0..100, derived from the species'
   *  intrinsic preferences scaled by current intensity. */
  desiredScore: number;
  /** Composite actual availability 0..100 for the resources this
   *  species cares about. */
  actualScore: number;
  /** max(0, desired - actual). */
  scarcityStress: number;
  /** When species' wanted resource is HIGH and stable, pressure
   *  to "hoard" rises (the species wants to preserve its niche). */
  hoardingPressure: number;
}

export interface AllocationConflict {
  speciesA: EcologySpeciesId;
  speciesB: EcologySpeciesId;
  resource: ResourceId;
  conflictScore: number;        // 0..10
}

export interface ExhaustionForecast {
  resource: ResourceId;
  level: number;
  burnRate: number;
  eventsToZero: number | null;  // null = not burning
}

export interface ResourceEconomyState {
  levels: ResourceLevels;
  flows: Record<ResourceId, ResourceFlow>;
  observationHistory: ResourceObservation[];
  collapseState: CollapseState;
  speciesAllocation: SpeciesAllocation[];
  allocationConflicts: AllocationConflict[];
  /** Aggregate measure of overall resource health 0..100. */
  reserveAggregate: number;
  /** Lifetime sum of total consumption. */
  totalConsumed: number;
  totalRestored: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function seedFlows(): Record<ResourceId, ResourceFlow> {
  const f: Partial<Record<ResourceId, ResourceFlow>> = {};
  for (const r of ALL_RESOURCES) {
    f[r] = { lastDelta: 0, emaRate: 0, burnRate: 0, restoreRate: 0 };
  }
  return f as Record<ResourceId, ResourceFlow>;
}

export function createInitialResourceEconomy(): ResourceEconomyState {
  const levels: ResourceLevels = {
    cognitiveEnergy:       RESOURCE_BASELINES.cognitiveEnergy,
    coherenceReserve:      RESOURCE_BASELINES.coherenceReserve,
    recoveryReserve:       RESOURCE_BASELINES.recoveryReserve,
    explorationCapital:    RESOURCE_BASELINES.explorationCapital,
    strategicStability:    RESOURCE_BASELINES.strategicStability,
    contradictionCapacity: RESOURCE_BASELINES.contradictionCapacity,
    executionLiquidity:    RESOURCE_BASELINES.executionLiquidity,
  };
  return {
    levels,
    flows: seedFlows(),
    observationHistory: [],
    collapseState: 'healthy',
    speciesAllocation: [],
    allocationConflicts: [],
    reserveAggregate: 56,
    totalConsumed: 0,
    totalRestored: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodResourceEconomy?: ResourceEconomyState };

export interface ResourceEconomyStore {
  read(): Promise<ResourceEconomyState>;
  save(state: ResourceEconomyState): Promise<void>;
  reset(): Promise<void>;
}

export function createResourceEconomyStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ResourceEconomyStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodResourceEconomy) return g.__moodResourceEconomy;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodResourceEconomy = {
          ...createInitialResourceEconomy(),
          ...(JSON.parse(txt) as Partial<ResourceEconomyState>),
        };
      } catch {
        g.__moodResourceEconomy = createInitialResourceEconomy();
      }
      return g.__moodResourceEconomy;
    },
    async save(state) {
      state.observationHistory = state.observationHistory.slice(-HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodResourceEconomy = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodResourceEconomy = undefined;
    },
  };
}
