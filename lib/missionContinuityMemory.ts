/**
 * MISSION CONTINUITY MEMORY (Wave 40)
 *
 * Persistent civilizational gravity. NOT philosophical purpose,
 * NOT identity narration, NOT meaning. Pure operational continuity
 * physics: does the trajectory preserve long-term mission integrity
 * across resource scarcity, environmental hostility, ecology shifts,
 * and goal replacement?
 *
 * The store carries deeper-than-goal mission vectors that survive
 * temporary pressure, lineage chains that link mutated vectors back
 * to their ancestors, and a derived civilization state with explicit
 * momentum + hysteresis so no single event can flip continuity.
 *
 * Lives at data/memory/mission-continuity.json. Histories FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'mission-continuity.json';
export const VECTOR_HISTORY_LIMIT = 32;
export const DRIFT_HISTORY_LIMIT = 32;
export const LINEAGE_HISTORY_LIMIT = 32;
export const CONFLICT_HISTORY_LIMIT = 24;

/** Five seeded strategic directions. Vectors evolve and may mutate
 *  into child vectors over time; the original five are seeds, not
 *  hard-coded singletons. */
export type StrategicDirection =
  | 'exploratory'
  | 'conservative'
  | 'optimizing'
  | 'protective'
  | 'integrative';

export type MissionActivationState =
  | 'dormant' | 'forming' | 'active' | 'fading' | 'lineage-stored';

export interface VectorReinforcementSample {
  at: number;
  tick: number;
  reinforcement: number;     // signed contribution this event
  persistenceWeight: number; // resulting weight
}

export interface MissionVector {
  id: string;
  originatingEpoch: number;       // tick the vector was first observed
  parentVectorId: string | null;  // null for seed vectors
  strategicDirection: StrategicDirection;
  /** 0..10 — cumulative reinforcement minus decay. Determines
   *  activationState through hysteresis bands. */
  persistenceWeight: number;
  /** Lifetime count of events where this vector was reinforced. */
  historicalReinforcement: number;
  /** 0..1 — natural decay per event when not reinforced. */
  degradationRate: number;
  /** 0..10 — strength of anchor binding this vector to its lineage. */
  continuityAnchor: number;
  /** 0..10 — resistance to being abandoned despite scarcity. */
  abandonmentResistance: number;
  /** 0..10 — tolerance for mutation. High = vector accepts variation
   *  in how it's reinforced; low = vector demands its specific shape. */
  mutationTolerance: number;
  /** IDs of lineage-connected vectors (parents, siblings, children). */
  lineageConnections: string[];
  activationState: MissionActivationState;
  lastReinforcedAt: number | null;
  lastReinforcedTick: number;
  reinforcementHistory: VectorReinforcementSample[];
}

export interface DriftObservation {
  at: number;
  tick: number;
  existentialDrift: number;
  driver: 'switching' | 'contradiction' | 'continuity-break' | 'volatility' | 'doctrine-deviation';
}

export interface LineageEvent {
  at: number;
  tick: number;
  kind: 'mutation' | 'inheritance' | 'merge' | 'abandonment';
  fromVectorId: string;
  toVectorId: string;
  mutationDistance: number;       // 0..10
  inheritanceStrength: number;    // 0..10
  continuityPreserved: number;    // 0..10
  civilizationDeviation: number;  // 0..10
}

export interface ContinuityConflict {
  at: number;
  tick: number;
  kind: 'continuity' | 'adaptation' | 'survival-tradeoff' | 'doctrine-deviation' | 'persistence-stress';
  intensity: number;              // 0..10
  description: string;
}

export type CivilizationState =
  | 'coherent'
  | 'drifting'
  | 'fractured'
  | 'adaptive-stable'
  | 'continuity-fragile'
  | 'over-mutated'
  | 'lineage-preserved'
  | 'mission-exhausted';

export interface MissionContinuityState {
  /** Civilization age in cognitive events. */
  civilizationAge: number;
  /** 0..10 — composite of vector persistence weights + activation. */
  continuityStrength: number;
  /** 0..10 — alignment of current activity with dominant historical vectors. */
  missionIntegrity: number;
  /** 0..10 — degradation signal (higher = more drift). */
  existentialDrift: number;
  /** 0..10 — depth and stability of lineage chains. */
  lineageStability: number;
  /** 0..10 — derived from continuity preservation across past N events. */
  longHorizonCoherence: number;
  /** 0..10 — how much continuity is preserved during adaptation events. */
  adaptationContinuity: number;
  /** 0..10 — average activation-weighted vector age. */
  strategicPersistence: number;
  /** 0..10 — pressure to preserve continuity; rises when integrity is threatened. */
  missionPressure: number;
  /** signed EWMA of continuityStrength delta. */
  continuityMomentum: number;

  vectors: MissionVector[];
  driftHistory: DriftObservation[];
  lineageEvents: LineageEvent[];
  recentConflicts: ContinuityConflict[];

  state: CivilizationState;
  statePersistenceTicks: number;

  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function seedVector(direction: StrategicDirection, idx: number): MissionVector {
  return {
    id: `vec-seed-${direction}-${idx}`,
    originatingEpoch: 0,
    parentVectorId: null,
    strategicDirection: direction,
    persistenceWeight: 3,
    historicalReinforcement: 0,
    degradationRate: 0.05,
    continuityAnchor: 5,
    abandonmentResistance: 5,
    mutationTolerance: 5,
    lineageConnections: [],
    activationState: 'forming',
    lastReinforcedAt: null,
    lastReinforcedTick: 0,
    reinforcementHistory: [],
  };
}

export function createInitialMissionContinuity(): MissionContinuityState {
  return {
    civilizationAge: 0,
    continuityStrength: 5,
    missionIntegrity: 7,
    existentialDrift: 0,
    lineageStability: 5,
    longHorizonCoherence: 6,
    adaptationContinuity: 6,
    strategicPersistence: 0,
    missionPressure: 0,
    continuityMomentum: 0,
    vectors: [
      seedVector('exploratory',  1),
      seedVector('conservative', 2),
      seedVector('optimizing',   3),
      seedVector('protective',   4),
      seedVector('integrative',  5),
    ],
    driftHistory: [],
    lineageEvents: [],
    recentConflicts: [],
    state: 'coherent',
    statePersistenceTicks: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodMission?: MissionContinuityState };

export interface MissionContinuityStore {
  read(): Promise<MissionContinuityState>;
  save(state: MissionContinuityState): Promise<void>;
  reset(): Promise<void>;
}

export function createMissionContinuityStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MissionContinuityStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodMission) return g.__moodMission;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodMission = {
          ...createInitialMissionContinuity(),
          ...(JSON.parse(txt) as Partial<MissionContinuityState>),
        };
      } catch {
        g.__moodMission = createInitialMissionContinuity();
      }
      return g.__moodMission;
    },
    async save(state) {
      state.driftHistory = state.driftHistory.slice(-DRIFT_HISTORY_LIMIT);
      state.lineageEvents = state.lineageEvents.slice(-LINEAGE_HISTORY_LIMIT);
      state.recentConflicts = state.recentConflicts.slice(-CONFLICT_HISTORY_LIMIT);
      for (const v of state.vectors) {
        v.reinforcementHistory = v.reinforcementHistory.slice(-VECTOR_HISTORY_LIMIT);
      }
      state.updatedAt = nowMs();
      g.__moodMission = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMission = undefined;
    },
  };
}
