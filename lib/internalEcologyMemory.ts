/**
 * INTERNAL ECOLOGY MEMORY (Wave 37)
 *
 * Four numeric pressure species — explorer, conservator, optimizer,
 * guardian — each tracked as a deterministic operational drive.
 * NOT personalities. NOT agents. NOT chat sub-assistants. Pure
 * EWMA-smoothed pressure metrics that accumulate from cognitive
 * events, fatigue from sustained dominance, and compete for
 * influence over the governance gradients.
 *
 * Lives at data/memory/internal-ecology.json. All histories
 * FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'internal-ecology.json';

export const PRESSURE_HISTORY_LIMIT = 32;
export const DOMINANCE_HISTORY_LIMIT = 32;
export const SHIFT_HISTORY_LIMIT = 32;
export const TENSION_HISTORY_LIMIT = 32;

export type SpeciesId = 'explorer' | 'conservator' | 'optimizer' | 'guardian';

export type ActivationState =
  | 'dormant' | 'forming' | 'active' | 'fatigued' | 'recovering';

export type EcologyState =
  | 'balanced' | 'exploratory' | 'defensive'
  | 'exhausted' | 'over-optimized' | 'unstable';

export interface SpeciesObservation {
  at: number;
  tick: number;
  intensity: number;
  delta: number;
}

export interface DominanceObservation {
  at: number;
  tick: number;
  influenceWeight: number;
}

export interface DominanceShift {
  at: number;
  tick: number;
  from: SpeciesId | null;
  to: SpeciesId;
  reason: string;
}

export interface Species {
  id: SpeciesId;
  /** 0..10 — EWMA-smoothed pressure signal. */
  intensity: number;
  /** 0..10 — accumulates with sustained dominance; decays during rest. */
  fatigue: number;
  /** 0..1 — normalized share of total intensity across all species. */
  influenceWeight: number;
  /** 0..10 — short-window intensity swing range. */
  volatility: number;
  /** 0..1 — base rate of fatigue decay per event when intensity is low. */
  recoveryRate: number;
  pressureHistory: SpeciesObservation[];
  dominanceHistory: DominanceObservation[];
  activationState: ActivationState;
  lastShiftTick: number;
  cumulativeWins: number;
  cumulativeLosses: number;
}

export type SpeciesPairId =
  | 'explorer-guardian'
  | 'explorer-conservator'
  | 'optimizer-explorer'
  | 'optimizer-guardian';

export interface SpeciesTensionPair {
  pairId: SpeciesPairId;
  speciesA: SpeciesId;
  speciesB: SpeciesId;
  /** 0..10 — current inter-species tension. */
  tension: number;
  /** 0..10 — inverse of recent tension swing magnitude. */
  stability: number;
  /** EWMA-smoothed tension. */
  historicalMean: number;
  /** Recent positive rate of tension change. */
  escalationVelocity: number;
  /** Recent negative rate of tension change. */
  recoveryVelocity: number;
  /** Last-event delta — kept for velocity computation. */
  lastDelta: number;
}

export interface InternalEcologyState {
  species: Species[];
  tensionPairs: SpeciesTensionPair[];
  dominantSpecies: SpeciesId | null;
  /** Hysteresis margin the current dominant must lose by before
   *  the engine declares a new dominant. */
  dominantSince: { at: number; tick: number } | null;
  ecologicalBalance: number;        // 0..10 — inverse of weight spread
  volatilityField: number;          // 0..10 — mean volatility across species
  survivabilityBias: number;        // -0.25..+0.25 — guardian net influence
  expansionBias: number;            // -0.25..+0.25 — explorer net influence
  conservationBias: number;         // -0.25..+0.25 — conservator net influence
  state: EcologyState;
  dominanceShifts: DominanceShift[];
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

const ALL_SPECIES: SpeciesId[] = ['explorer', 'conservator', 'optimizer', 'guardian'];

function seedSpecies(): Species[] {
  return ALL_SPECIES.map((id) => ({
    id,
    intensity: 5,                    // neutral seed
    fatigue: 0,
    influenceWeight: 0.25,           // equal initial share
    volatility: 0,
    recoveryRate: 0.08,
    pressureHistory: [],
    dominanceHistory: [],
    activationState: 'forming',
    lastShiftTick: 0,
    cumulativeWins: 0,
    cumulativeLosses: 0,
  }));
}

function seedTensionPairs(): SpeciesTensionPair[] {
  const seed = (pairId: SpeciesPairId, a: SpeciesId, b: SpeciesId): SpeciesTensionPair => ({
    pairId, speciesA: a, speciesB: b,
    tension: 0, stability: 8,
    historicalMean: 0,
    escalationVelocity: 0, recoveryVelocity: 0, lastDelta: 0,
  });
  return [
    seed('explorer-guardian',    'explorer', 'guardian'),
    seed('explorer-conservator', 'explorer', 'conservator'),
    seed('optimizer-explorer',   'optimizer', 'explorer'),
    seed('optimizer-guardian',   'optimizer', 'guardian'),
  ];
}

export function createInitialEcology(): InternalEcologyState {
  return {
    species: seedSpecies(),
    tensionPairs: seedTensionPairs(),
    dominantSpecies: null,
    dominantSince: null,
    ecologicalBalance: 10,
    volatilityField: 0,
    survivabilityBias: 0,
    expansionBias: 0,
    conservationBias: 0,
    state: 'balanced',
    dominanceShifts: [],
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodEcology?: InternalEcologyState };

export interface InternalEcologyStore {
  read(): Promise<InternalEcologyState>;
  save(state: InternalEcologyState): Promise<void>;
  reset(): Promise<void>;
}

export function createInternalEcologyStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): InternalEcologyStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodEcology) return g.__moodEcology;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodEcology = {
          ...createInitialEcology(),
          ...(JSON.parse(txt) as Partial<InternalEcologyState>),
        };
      } catch {
        g.__moodEcology = createInitialEcology();
      }
      return g.__moodEcology;
    },
    async save(state) {
      // FIFO-cap every history array.
      for (const sp of state.species) {
        sp.pressureHistory = sp.pressureHistory.slice(-PRESSURE_HISTORY_LIMIT);
        sp.dominanceHistory = sp.dominanceHistory.slice(-DOMINANCE_HISTORY_LIMIT);
      }
      state.dominanceShifts = state.dominanceShifts.slice(-SHIFT_HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodEcology = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodEcology = undefined;
    },
  };
}
