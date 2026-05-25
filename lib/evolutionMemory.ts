/**
 * EVOLUTION MEMORY (Wave 41)
 *
 * Persistent civilizational evolution tree. Lineages carry abstract
 * structural genomes (governance rigidity, recovery weighting,
 * exploration tolerance, doctrine weighting, ecology sensitivity,
 * continuity preservation, mutation tolerance, collapse response,
 * strategic horizon weighting) that mutate deterministically under
 * accumulated operational pressure. Each lineage's fitness is
 * computed via multi-horizon simulation using its genome's gradient
 * projection.
 *
 * NOT genetic algorithm. NOT stochastic AI evolution. Every mutation,
 * fitness sample, selection decision is reproducible from the same
 * input state. Same history → same evolution tree.
 *
 * Lives at data/memory/evolution-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'evolution-memory.json';

export const LINEAGE_LIMIT = 32;
export const FITNESS_SAMPLE_LIMIT = 24;
export const GENERATION_EVENT_LIMIT = 32;
export const PRESSURE_HISTORY_LIMIT = 32;

/** Nine structural parameters that mutate over generations. Each 0..1. */
export interface CivilizationGenome {
  governanceRigidity: number;
  recoveryWeighting: number;
  explorationTolerance: number;
  doctrineWeighting: number;
  ecologySensitivity: number;
  continuityPreservation: number;
  mutationTolerance: number;
  collapseResponse: number;
  strategicHorizonWeighting: number;
}

export type GenomeKey = keyof CivilizationGenome;

export const ALL_GENOME_KEYS: GenomeKey[] = [
  'governanceRigidity', 'recoveryWeighting', 'explorationTolerance',
  'doctrineWeighting', 'ecologySensitivity', 'continuityPreservation',
  'mutationTolerance', 'collapseResponse', 'strategicHorizonWeighting',
];

export type MutationOrigin =
  | 'collapse-recurrence'
  | 'regret-accumulation'
  | 'doctrine-scars'
  | 'survivability-failure'
  | 'ecology-instability'
  | 'continuity-fragmentation'
  | 'historical-precedent'
  | 'seed';

export type CivilizationSpecies =
  | 'unspeciated'
  | 'preservation-civilization'
  | 'expansion-civilization'
  | 'adaptive-civilization'
  | 'mutation-civilization'
  | 'governance-civilization'
  | 'recovery-civilization'
  | 'continuity-civilization';

export type LineageStatus = 'active' | 'dominant' | 'declining' | 'extinct';

export interface FitnessSample {
  at: number;
  tick: number;
  longSurvivability: number;         // 0..1 from +250 horizon
  continuityIntegrity: number;       // 0..10 from coherence proxy
  ecologicalBalance: number;         // 0..10 from end-state tension/stress
  collapseResistance: number;        // 0..10 — inverse of entered-critical
  recoveryCapability: number;        // 0..10 from end-state budget+energy
  strategicConsistency: number;      // 0..10 — short-vs-long alignment
  civilizationPersistence: number;   // 0..10 from coherence stability
  composite: number;                 // 0..10 composite fitness
}

export interface CollapseEvent {
  at: number;
  tick: number;
  /** Which horizon flagged the collapse trajectory. */
  horizon: number;
  severity: number;                  // 0..10
}

export interface CivilizationLineage {
  lineageId: string;
  parentLineageId: string | null;
  generation: number;
  bornAtTick: number;
  bornAt: number;

  genome: CivilizationGenome;
  /** Per-key delta from parent's genome at birth. Empty for seed. */
  mutationVector: Partial<Record<GenomeKey, number>>;
  /** What pressure produced this mutation. */
  mutationOrigin: MutationOrigin;
  /** Specific reason text. */
  selectionReason: string;
  /** Marked when status='extinct'. */
  extinctionReason: string | null;
  extinctionAtTick: number | null;

  fitnessHistory: FitnessSample[];
  collapseHistory: CollapseEvent[];

  /** EWMA-smoothed fitness composite — used for ranking. */
  selectionScore: number;
  /** 0..1 — confidence the lineage is heading toward extinction. */
  extinctionRisk: number;
  /** 0..10 — recent fitness variance proxy. */
  lineageStability: number;
  /** 0..10 — fitness recovery after dips. */
  adaptationEfficiency: number;

  status: LineageStatus;
  /** Computed from genome + fitness pattern. */
  civilizationSpecies: CivilizationSpecies;
  lastSampledTick: number;
  lastSampledAt: number;
  sampleCount: number;
}

export interface GenerationEvent {
  at: number;
  tick: number;
  generation: number;
  /** Lineages spawned this generation. */
  spawnedLineageIds: string[];
  /** Pre-generation dominant lineage. */
  priorDominantId: string | null;
  /** Post-generation dominant lineage. */
  newDominantId: string | null;
  /** What pressure triggered evolution. */
  triggerPressure: number;
  /** Whether dominant changed. */
  dominantShifted: boolean;
}

export interface EvolutionaryPressureSample {
  at: number;
  tick: number;
  pressure: number;                  // 0..10 composite
  collapseRecurrenceContrib: number;
  regretContrib: number;
  doctrineScarsContrib: number;
  survivabilityFailureContrib: number;
  ecologyInstabilityContrib: number;
  continuityFragmentationContrib: number;
}

export interface EvolutionMemoryState {
  /** All known lineages keyed by lineageId. */
  lineages: Record<string, CivilizationLineage>;
  /** Current dominant lineageId. */
  dominantLineageId: string | null;
  /** Ticks the current dominant has held. */
  dominantPersistenceTicks: number;
  /** Lifetime generation counter. */
  currentGeneration: number;
  /** Events since last generation cycle (used to gate evolution). */
  eventsSinceLastGeneration: number;
  /** Composite evolutionary pressure 0..10. */
  evolutionaryPressure: number;
  /** Recent pressure samples. */
  pressureHistory: EvolutionaryPressureSample[];
  /** Generation event log. */
  generationEvents: GenerationEvent[];
  totalLineagesSpawned: number;
  totalExtinctions: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

/** Seed genome — perfectly neutral, all parameters at 0.5. */
export const SEED_GENOME: CivilizationGenome = {
  governanceRigidity:        0.50,
  recoveryWeighting:         0.50,
  explorationTolerance:      0.50,
  doctrineWeighting:         0.50,
  ecologySensitivity:        0.50,
  continuityPreservation:    0.50,
  mutationTolerance:         0.50,
  collapseResponse:          0.50,
  strategicHorizonWeighting: 0.50,
};

export function createSeedLineage(at: number, tick: number): CivilizationLineage {
  return {
    lineageId: 'lin-seed-0',
    parentLineageId: null,
    generation: 0,
    bornAtTick: tick,
    bornAt: at,
    genome: { ...SEED_GENOME },
    mutationVector: {},
    mutationOrigin: 'seed',
    selectionReason: 'civilization root',
    extinctionReason: null,
    extinctionAtTick: null,
    fitnessHistory: [],
    collapseHistory: [],
    selectionScore: 5,
    extinctionRisk: 0,
    lineageStability: 10,
    adaptationEfficiency: 5,
    status: 'dominant',
    civilizationSpecies: 'unspeciated',
    lastSampledTick: tick,
    lastSampledAt: at,
    sampleCount: 0,
  };
}

export function createInitialEvolutionMemory(): EvolutionMemoryState {
  const seedLineage = createSeedLineage(nowMs(), 0);
  return {
    lineages: { [seedLineage.lineageId]: seedLineage },
    dominantLineageId: seedLineage.lineageId,
    dominantPersistenceTicks: 0,
    currentGeneration: 0,
    eventsSinceLastGeneration: 0,
    evolutionaryPressure: 0,
    pressureHistory: [],
    generationEvents: [],
    totalLineagesSpawned: 1,
    totalExtinctions: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodEvolution?: EvolutionMemoryState };

export interface EvolutionMemoryStore {
  read(): Promise<EvolutionMemoryState>;
  save(state: EvolutionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createEvolutionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): EvolutionMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodEvolution) return g.__moodEvolution;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodEvolution = {
          ...createInitialEvolutionMemory(),
          ...(JSON.parse(txt) as Partial<EvolutionMemoryState>),
        };
      } catch {
        g.__moodEvolution = createInitialEvolutionMemory();
      }
      return g.__moodEvolution;
    },
    async save(state) {
      // Cap lineage count by pruning oldest extinct first, then oldest by tick.
      const lineageIds = Object.keys(state.lineages);
      if (lineageIds.length > LINEAGE_LIMIT) {
        const sorted = lineageIds
          .map((id) => state.lineages[id])
          .sort((a, b) => {
            const aExt = a.status === 'extinct' ? 0 : 1;
            const bExt = b.status === 'extinct' ? 0 : 1;
            if (aExt !== bExt) return aExt - bExt;
            return a.bornAtTick - b.bornAtTick;
          });
        const keep = sorted.slice(-LINEAGE_LIMIT);
        const kept: Record<string, CivilizationLineage> = {};
        for (const l of keep) kept[l.lineageId] = l;
        // Always keep the dominant.
        if (state.dominantLineageId && !kept[state.dominantLineageId] && state.lineages[state.dominantLineageId]) {
          kept[state.dominantLineageId] = state.lineages[state.dominantLineageId];
        }
        state.lineages = kept;
      }
      // Cap each lineage's fitness/collapse history.
      for (const l of Object.values(state.lineages)) {
        l.fitnessHistory = l.fitnessHistory.slice(-FITNESS_SAMPLE_LIMIT);
        l.collapseHistory = l.collapseHistory.slice(-FITNESS_SAMPLE_LIMIT);
      }
      state.pressureHistory = state.pressureHistory.slice(-PRESSURE_HISTORY_LIMIT);
      state.generationEvents = state.generationEvents.slice(-GENERATION_EVENT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodEvolution = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodEvolution = undefined;
    },
  };
}
