/**
 * ENVIRONMENT MEMORY (Wave 39)
 *
 * Seven external operational climate fields. NOT mood. NOT narrative
 * weather. Pure abstract operational pressure topology: market
 * weather, signal conditions, strategic terrain.
 *
 * Each field evolves semi-independently from deterministic drivers
 * (cognition density, contradiction load, ecology imbalance, resource
 * depletion, recursive simulation pressure, historical volatility,
 * recovery deficits). With explicit momentum + decay curves so the
 * environment has inertia — no instant flips.
 *
 * The organism affects the environment; the environment affects the
 * organism. Bidirectional coupling, one-event-lagged.
 *
 * Lives at data/memory/environment-state.json. Histories FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'environment-state.json';
export const HISTORY_LIMIT = 48;
export const TRAJECTORY_LIMIT = 24;

export type EnvironmentFieldId =
  | 'volatility'
  | 'opportunityDensity'
  | 'threatPressure'
  | 'recoveryClimate'
  | 'informationTurbulence'
  | 'stabilityField'
  | 'adaptationDifficulty';

export const ALL_ENV_FIELDS: EnvironmentFieldId[] = [
  'volatility', 'opportunityDensity', 'threatPressure',
  'recoveryClimate', 'informationTurbulence', 'stabilityField',
  'adaptationDifficulty',
];

/** Neutral baseline each field decays toward absent pressure. */
export const ENV_BASELINES: Record<EnvironmentFieldId, number> = {
  volatility:           3,
  opportunityDensity:   5,
  threatPressure:       2,
  recoveryClimate:      6,
  informationTurbulence: 3,
  stabilityField:       6,
  adaptationDifficulty: 3,
};

export interface EnvironmentLevels {
  volatility: number;
  opportunityDensity: number;
  threatPressure: number;
  recoveryClimate: number;
  informationTurbulence: number;
  stabilityField: number;
  adaptationDifficulty: number;
}

export interface EnvironmentMomentum {
  /** Last delta applied (this event). */
  lastDelta: number;
  /** EWMA-smoothed signed rate of change. */
  emaRate: number;
}

export interface EnvironmentObservation {
  at: number;
  tick: number;
  field: EnvironmentFieldId;
  level: number;
  delta: number;
}

export interface EnvironmentTrajectoryPoint {
  at: number;
  tick: number;
  level: number;
}

export type EnvironmentState =
  | 'stable' | 'turbulent' | 'hostile' | 'opportunity-rich'
  | 'depleted-climate' | 'unstable' | 'adaptive-fragile'
  | 'high-noise' | 'survivable' | 'collapse-prone';

/** Coupling observations — how the organism is currently affecting
 *  the environment and vice versa. Pure numbers. */
export interface CouplingSignal {
  /** How much aggressive cognition this event added to volatility. */
  organismToVolatility: number;
  /** How much contradiction pressure added to threat. */
  organismToThreat: number;
  /** How much rest / defer added to recovery climate. */
  organismToRecovery: number;
  /** How much environment volatility constrained governance. */
  environmentToGovernance: number;
  /** Net environment-induced cost multiplier this event. */
  environmentCostMultiplier: number;
}

export interface EnvironmentMemoryState {
  levels: EnvironmentLevels;
  momentum: Record<EnvironmentFieldId, EnvironmentMomentum>;
  trajectories: Record<EnvironmentFieldId, EnvironmentTrajectoryPoint[]>;
  observationHistory: EnvironmentObservation[];
  state: EnvironmentState;
  /** Number of events the system has held its current EnvironmentState. */
  statePersistenceTicks: number;
  /** Per-event coupling diagnostic. */
  lastCoupling: CouplingSignal | null;
  /** EWMA of |organismToVolatility|+|organismToThreat| — how much the
   *  organism is currently disturbing the environment. */
  organismImpactEMA: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function seedMomentum(): Record<EnvironmentFieldId, EnvironmentMomentum> {
  const m: Partial<Record<EnvironmentFieldId, EnvironmentMomentum>> = {};
  for (const f of ALL_ENV_FIELDS) m[f] = { lastDelta: 0, emaRate: 0 };
  return m as Record<EnvironmentFieldId, EnvironmentMomentum>;
}

function seedTrajectories(): Record<EnvironmentFieldId, EnvironmentTrajectoryPoint[]> {
  const t: Partial<Record<EnvironmentFieldId, EnvironmentTrajectoryPoint[]>> = {};
  for (const f of ALL_ENV_FIELDS) t[f] = [];
  return t as Record<EnvironmentFieldId, EnvironmentTrajectoryPoint[]>;
}

export function createInitialEnvironment(): EnvironmentMemoryState {
  return {
    levels: { ...ENV_BASELINES },
    momentum: seedMomentum(),
    trajectories: seedTrajectories(),
    observationHistory: [],
    state: 'stable',
    statePersistenceTicks: 0,
    lastCoupling: null,
    organismImpactEMA: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodEnvironment?: EnvironmentMemoryState };

export interface EnvironmentMemoryStore {
  read(): Promise<EnvironmentMemoryState>;
  save(state: EnvironmentMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createEnvironmentMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): EnvironmentMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodEnvironment) return g.__moodEnvironment;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodEnvironment = {
          ...createInitialEnvironment(),
          ...(JSON.parse(txt) as Partial<EnvironmentMemoryState>),
        };
      } catch {
        g.__moodEnvironment = createInitialEnvironment();
      }
      return g.__moodEnvironment;
    },
    async save(state) {
      state.observationHistory = state.observationHistory.slice(-HISTORY_LIMIT);
      for (const f of ALL_ENV_FIELDS) {
        state.trajectories[f] = state.trajectories[f].slice(-TRAJECTORY_LIMIT);
      }
      state.updatedAt = nowMs();
      g.__moodEnvironment = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodEnvironment = undefined;
    },
  };
}
