/**
 * HISTORICAL MEMORY (Wave 42)
 *
 * Persistent civilizational precedent. The organism now segments
 * its history into epochs (stable operational phases), discovers
 * recurring doctrine patterns statistically, accumulates scars
 * from repeatedly-failed patterns, and computes a maturity score
 * from longitudinal performance.
 *
 * NOT lore. NOT story. NOT narrated. Pure operational precedent
 * physics. Same history → same epochs / doctrines / scars / maturity.
 *
 * Lives at data/memory/historical-memory.json. Histories FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { SpeciesId } from './internalEcologyMemory';
import type { StrategicDirection } from './missionContinuityMemory';
import type { TrustZone } from './cognitiveGovernance';
import type { EnvironmentState } from './environmentMemory';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'historical-memory.json';

export const EPOCH_HISTORY_LIMIT = 32;
export const DOCTRINE_OUTCOME_HISTORY_LIMIT = 32;
export const COLLAPSE_HISTORY_LIMIT = 24;
export const TRANSITION_HISTORY_LIMIT = 32;

// ─── epochs ────────────────────────────────────────────────────

export type EpochArchetype =
  | 'expansion'
  | 'recovery'
  | 'fragmentation'
  | 'scarcity'
  | 'continuity-preservation'
  | 'hyper-optimization'
  | 'ecological-hostility'
  | 'transitional';

export interface EpochSignature {
  /** Dominant ecology species ID for this epoch. */
  dominantSpecies: SpeciesId | null;
  /** Top-weighted mission vector strategic direction. */
  dominantMissionVector: StrategicDirection | null;
  /** Modal governance zone over the epoch. */
  averageGovernanceZone: TrustZone;
  /** Modal environment state over the epoch. */
  environmentSignature: EnvironmentState;
  /** EWMA continuity state classifier modal. */
  continuityState: string;
  /** 0..10 — survivability trend over the epoch. */
  survivabilityTrend: number;
  /** 0..10 — average contradiction tension across pairs. */
  contradictionDensity: number;
  /** 0..100 — average resource aggregate over the epoch. */
  resourceClimate: number;
  /** 0..10 — collapse risk score derived from contradiction + scarcity. */
  collapseRisk: number;
  /** ticks the epoch persisted. */
  stabilityDuration: number;
  /** 0..10 — adaptation pressure during the epoch. */
  adaptationPressure: number;
}

export interface Epoch {
  id: string;
  archetype: EpochArchetype;
  startTick: number;
  endTick: number | null;       // null = currently active
  startedAt: number;
  endedAt: number | null;
  signature: EpochSignature;
  /** Doctrine IDs observed during this epoch. */
  doctrineOutcomes: string[];
  totalEvents: number;
}

// ─── doctrines ─────────────────────────────────────────────────

export type DoctrineId =
  | 'fragmentation-doctrine'      // high throughput + low recovery
  | 'preservation-doctrine'       // protective governance + high continuity
  | 'mutation-doctrine'           // aggressive adaptation + high drift
  | 'stability-doctrine'          // low volatility + high integrity
  | 'exhaustion-doctrine'         // sustained scarcity + low resources
  | 'expansion-doctrine'          // opportunity-rich + exploration
  | 'throttle-doctrine'           // restricted governance + low throughput
  | 'collapse-doctrine';          // critical multi-resource depletion

export interface DoctrineMatch {
  doctrineId: DoctrineId;
  /** How confidently the current state matches this doctrine. 0..1. */
  matchStrength: number;
  /** The dominant signal that triggered the match. */
  trigger: string;
}

export interface DoctrineOutcomeSample {
  at: number;
  tick: number;
  /** Reliability at sample time (0..10). */
  reliabilityAtSample: number;
  /** Continuity at sample time (0..10). */
  continuityAtSample: number;
  /** Resource aggregate at sample (0..100). */
  resourceAtSample: number;
  /** Match strength when sampled. 0..1. */
  matchStrength: number;
}

export interface Doctrine {
  doctrineId: DoctrineId;
  recurrenceCount: number;
  /** EWMA of reliability impact: delta in cumulative reliability
   *  while this doctrine was matched, normalized. -10..+10 range. */
  survivabilityImpact: number;
  /** EWMA of continuity impact. -10..+10. */
  continuityImpact: number;
  /** Count of times this doctrine matched at the moment a collapse
   *  state was reached in the resource economy. */
  collapseAssociation: number;
  /** Count of times this doctrine matched when reliability recovered. */
  recoveryAssociation: number;
  /** EWMA of resource aggregate observed during matches. */
  resourceCost: number;
  /** EWMA of mission adaptation continuity during matches. */
  adaptationEffect: number;
  /** 0..10 — composite long-horizon viability. */
  longHorizonScore: number;
  /** Recent samples FIFO. */
  recentSamples: DoctrineOutcomeSample[];
  firstObservedAt: number | null;
  firstObservedTick: number;
  lastObservedAt: number | null;
  lastObservedTick: number;
}

// ─── scars ─────────────────────────────────────────────────────

export interface Scar {
  /** Which doctrine the scar is anchored to. */
  doctrineId: DoctrineId;
  /** 0..10 — scar intensity (decays slowly, accumulates on repeated harm). */
  intensity: number;
  /** Count of incidents that contributed to the scar. */
  incidentCount: number;
  /** Tick of most recent incident. */
  lastIncidentTick: number;
  /** EWMA of the harm magnitude per incident. */
  averageHarm: number;
}

// ─── collapse archetypes ───────────────────────────────────────

export type CollapseArchetypeId =
  | 'resource-exhaustion-loop'
  | 'contradiction-spiral'
  | 'mutation-cascade'
  | 'continuity-erosion'
  | 'hostile-environment-amplification'
  | 'governance-over-throttling'
  | 'adaptation-runaway';

export interface CollapseArchetype {
  archetypeId: CollapseArchetypeId;
  /** Number of detected occurrences. */
  detectionCount: number;
  /** 0..1 — confidence the archetype is recurring. */
  recurrenceConfidence: number;
  /** EWMA of how severe (typical reliability drop, etc.) each occurrence is. */
  averageSeverity: number;
  lastDetectedTick: number;
  lastDetectedAt: number;
}

// ─── civilization maturity + transitions ──────────────────────

export type CivilizationMaturityState =
  | 'naive'
  | 'adaptive'
  | 'historically-aware'
  | 'scar-conditioned'
  | 'continuity-trained'
  | 'collapse-sensitive'
  | 'mature-stable'
  | 'over-traumatized';

export interface CivilizationTransition {
  at: number;
  tick: number;
  from: CivilizationMaturityState;
  to: CivilizationMaturityState;
  reason: string;
}

// ─── top-level state ───────────────────────────────────────────

export interface HistoricalMemoryState {
  /** Sequential epoch log (last entry may be active). */
  epochs: Epoch[];
  /** All doctrines tracked, keyed by id. */
  doctrines: Record<DoctrineId, Doctrine>;
  /** All scars, keyed by doctrine id. */
  scars: Record<string, Scar>;
  /** Collapse archetype detection. */
  collapseArchetypes: Record<CollapseArchetypeId, CollapseArchetype>;
  /** EWMA-smoothed candidate signature accumulator for the current
   *  epoch. When it diverges enough from the current epoch signature,
   *  the epoch closes and a new one starts. */
  signatureAccumulator: EpochSignature;
  signatureSampleCount: number;
  /** 0..10 — composite civilization maturity score. */
  maturityScore: number;
  /** Banded by maturity + scars + collapse-archetype activity. */
  maturityState: CivilizationMaturityState;
  /** Ticks the current maturity state has persisted. */
  maturityPersistenceTicks: number;
  /** Maturity transitions log (FIFO-capped). */
  transitions: CivilizationTransition[];
  /** Lifetime epoch count. */
  totalEpochs: number;
  /** Lifetime sum of doctrine matches across all events. */
  totalDoctrineMatches: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function emptyDoctrine(id: DoctrineId, tick: number): Doctrine {
  return {
    doctrineId: id,
    recurrenceCount: 0,
    survivabilityImpact: 0,
    continuityImpact: 0,
    collapseAssociation: 0,
    recoveryAssociation: 0,
    resourceCost: 50,
    adaptationEffect: 6,
    longHorizonScore: 5,
    recentSamples: [],
    firstObservedAt: null,
    firstObservedTick: tick,
    lastObservedAt: null,
    lastObservedTick: tick,
  };
}

function emptyCollapseArchetype(id: CollapseArchetypeId): CollapseArchetype {
  return {
    archetypeId: id,
    detectionCount: 0,
    recurrenceConfidence: 0,
    averageSeverity: 0,
    lastDetectedTick: 0,
    lastDetectedAt: 0,
  };
}

const ALL_DOCTRINES: DoctrineId[] = [
  'fragmentation-doctrine', 'preservation-doctrine', 'mutation-doctrine',
  'stability-doctrine', 'exhaustion-doctrine', 'expansion-doctrine',
  'throttle-doctrine', 'collapse-doctrine',
];

const ALL_COLLAPSE_ARCHETYPES: CollapseArchetypeId[] = [
  'resource-exhaustion-loop', 'contradiction-spiral', 'mutation-cascade',
  'continuity-erosion', 'hostile-environment-amplification',
  'governance-over-throttling', 'adaptation-runaway',
];

export function createInitialHistoricalMemory(): HistoricalMemoryState {
  const doctrines: Record<DoctrineId, Doctrine> = {} as Record<DoctrineId, Doctrine>;
  for (const d of ALL_DOCTRINES) doctrines[d] = emptyDoctrine(d, 0);
  const archetypes: Record<CollapseArchetypeId, CollapseArchetype> = {} as Record<CollapseArchetypeId, CollapseArchetype>;
  for (const a of ALL_COLLAPSE_ARCHETYPES) archetypes[a] = emptyCollapseArchetype(a);
  return {
    epochs: [],
    doctrines,
    scars: {},
    collapseArchetypes: archetypes,
    signatureAccumulator: {
      dominantSpecies: null,
      dominantMissionVector: null,
      averageGovernanceZone: 'high-trust',
      environmentSignature: 'stable',
      continuityState: 'coherent',
      survivabilityTrend: 7,
      contradictionDensity: 0,
      resourceClimate: 56,
      collapseRisk: 0,
      stabilityDuration: 0,
      adaptationPressure: 0,
    },
    signatureSampleCount: 0,
    maturityScore: 0,
    maturityState: 'naive',
    maturityPersistenceTicks: 0,
    transitions: [],
    totalEpochs: 0,
    totalDoctrineMatches: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodHistorical?: HistoricalMemoryState };

export interface HistoricalMemoryStore {
  read(): Promise<HistoricalMemoryState>;
  save(state: HistoricalMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createHistoricalMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): HistoricalMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodHistorical) return g.__moodHistorical;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodHistorical = {
          ...createInitialHistoricalMemory(),
          ...(JSON.parse(txt) as Partial<HistoricalMemoryState>),
        };
      } catch {
        g.__moodHistorical = createInitialHistoricalMemory();
      }
      return g.__moodHistorical;
    },
    async save(state) {
      state.epochs = state.epochs.slice(-EPOCH_HISTORY_LIMIT);
      state.transitions = state.transitions.slice(-TRANSITION_HISTORY_LIMIT);
      for (const d of Object.values(state.doctrines)) {
        d.recentSamples = d.recentSamples.slice(-DOCTRINE_OUTCOME_HISTORY_LIMIT);
      }
      state.updatedAt = nowMs();
      g.__moodHistorical = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodHistorical = undefined;
    },
  };
}
