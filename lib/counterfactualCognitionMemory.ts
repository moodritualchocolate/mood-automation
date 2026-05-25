/**
 * COUNTERFACTUAL COGNITION MEMORY
 *
 * Persistent FIFO memory of counterfactual projection observations.
 * Same observation stream → same memory state → same longitudinal view.
 *
 * Tracks which alternate campaign paths the system repeatedly
 * imagines, and which archetypes consistently would have shifted
 * impact axes in particular directions. The longitudinal layer
 * uses this to surface "if leader X had led recently, runs would
 * have averaged +Y trust impact."
 *
 * STRICTLY observational. Append is the only mutating operation.
 *
 * Lives at data/memory/counterfactual-cognition-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import type { CognitiveSystem } from './cognitiveWeightEvolution';
import type {
  CampaignArchetype, CounterfactualProjection,
} from './counterfactualCognitionEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'counterfactual-cognition-memory.json';

export const COUNTERFACTUAL_OBSERVATION_LIMIT = 96;
export const RECENT_WINDOW = 12;

// ─── observation ──────────────────────────────────────────────

export interface CompactProjection {
  alternateLeader: CognitiveSystem;
  archetype: CampaignArchetype;
  trustImpact: number;
  fatigueImpact: number;
  durabilityImpact: number;
  divergenceFromActual: number;
  plausibility: number;
}

export interface CounterfactualObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  actualLeader: CognitiveSystem | null;
  actualArchetype: CampaignArchetype | null;
  projections: CompactProjection[];
  /** The single highest-trust-impact archetype this run. */
  trustOptimizedArchetype: CampaignArchetype | null;
  /** The single highest-durability-impact archetype this run. */
  durabilityOptimizedArchetype: CampaignArchetype | null;
}

// ─── state ─────────────────────────────────────────────────────

/** Per-(alternateLeader × archetype) aggregate row. */
export interface PathwayAggregate {
  count: number;
  trustImpactSum: number;
  fatigueImpactSum: number;
  durabilityImpactSum: number;
  divergenceSum: number;
  plausibilitySum: number;
}

export interface CounterfactualCognitionMemoryState {
  observations: CounterfactualObservation[];
  /** Aggregate per "leader|archetype" pair. */
  pathwayStats: Record<string, PathwayAggregate>;
  /** Count of how many times each archetype was projected. */
  archetypeProjectionCounts: Record<CampaignArchetype, number>;
  /** Count of how many times each archetype was trust-optimal. */
  trustOptimizedCounts: Record<CampaignArchetype, number>;
  /** Count of how many times each archetype was durability-optimal. */
  durabilityOptimizedCounts: Record<CampaignArchetype, number>;
  /** Count of how many times each cognitive system was the actual leader. */
  actualLeaderCounts: Record<string, number>;
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialCounterfactualCognitionMemory(): CounterfactualCognitionMemoryState {
  return {
    observations: [],
    pathwayStats: {},
    archetypeProjectionCounts: {} as Record<CampaignArchetype, number>,
    trustOptimizedCounts: {} as Record<CampaignArchetype, number>,
    durabilityOptimizedCounts: {} as Record<CampaignArchetype, number>,
    actualLeaderCounts: {},
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function pathwayKey(leader: CognitiveSystem, archetype: CampaignArchetype): string {
  return `${leader}|${archetype}`;
}

export function applyCounterfactualObservation(
  state: CounterfactualCognitionMemoryState,
  obs: CounterfactualObservation,
): CounterfactualCognitionMemoryState {
  const nextPathway = { ...state.pathwayStats };
  const nextArchCount = { ...state.archetypeProjectionCounts };
  for (const p of obs.projections) {
    const k = pathwayKey(p.alternateLeader, p.archetype);
    const cur = nextPathway[k] ?? {
      count: 0, trustImpactSum: 0, fatigueImpactSum: 0,
      durabilityImpactSum: 0, divergenceSum: 0, plausibilitySum: 0,
    };
    nextPathway[k] = {
      count: cur.count + 1,
      trustImpactSum: cur.trustImpactSum + p.trustImpact,
      fatigueImpactSum: cur.fatigueImpactSum + p.fatigueImpact,
      durabilityImpactSum: cur.durabilityImpactSum + p.durabilityImpact,
      divergenceSum: cur.divergenceSum + p.divergenceFromActual,
      plausibilitySum: cur.plausibilitySum + p.plausibility,
    };
    nextArchCount[p.archetype] = (nextArchCount[p.archetype] ?? 0) + 1;
  }
  const nextTrustOpt = { ...state.trustOptimizedCounts };
  if (obs.trustOptimizedArchetype) {
    nextTrustOpt[obs.trustOptimizedArchetype] = (nextTrustOpt[obs.trustOptimizedArchetype] ?? 0) + 1;
  }
  const nextDurOpt = { ...state.durabilityOptimizedCounts };
  if (obs.durabilityOptimizedArchetype) {
    nextDurOpt[obs.durabilityOptimizedArchetype] = (nextDurOpt[obs.durabilityOptimizedArchetype] ?? 0) + 1;
  }
  const nextActualLeader = { ...state.actualLeaderCounts };
  if (obs.actualLeader) {
    nextActualLeader[obs.actualLeader] = (nextActualLeader[obs.actualLeader] ?? 0) + 1;
  }
  return {
    observations: [...state.observations, obs].slice(-COUNTERFACTUAL_OBSERVATION_LIMIT),
    pathwayStats: nextPathway,
    archetypeProjectionCounts: nextArchCount,
    trustOptimizedCounts: nextTrustOpt,
    durabilityOptimizedCounts: nextDurOpt,
    actualLeaderCounts: nextActualLeader,
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCounterfactualCognition?: CounterfactualCognitionMemoryState };

export interface CounterfactualCognitionMemoryStore {
  read(): Promise<CounterfactualCognitionMemoryState>;
  append(obs: CounterfactualObservation): Promise<CounterfactualCognitionMemoryState>;
  save(state: CounterfactualCognitionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCounterfactualCognitionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CounterfactualCognitionMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CounterfactualCognitionMemoryStore = {
    async read() {
      if (g.__moodCounterfactualCognition) return g.__moodCounterfactualCognition;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CounterfactualCognitionMemoryState>;
        g.__moodCounterfactualCognition = {
          ...createInitialCounterfactualCognitionMemory(),
          ...parsed,
          pathwayStats:               { ...(parsed.pathwayStats ?? {}) },
          archetypeProjectionCounts:  { ...(parsed.archetypeProjectionCounts ?? {}) } as Record<CampaignArchetype, number>,
          trustOptimizedCounts:       { ...(parsed.trustOptimizedCounts ?? {}) } as Record<CampaignArchetype, number>,
          durabilityOptimizedCounts:  { ...(parsed.durabilityOptimizedCounts ?? {}) } as Record<CampaignArchetype, number>,
          actualLeaderCounts:         { ...(parsed.actualLeaderCounts ?? {}) },
        };
      } catch {
        g.__moodCounterfactualCognition = createInitialCounterfactualCognitionMemory();
      }
      return g.__moodCounterfactualCognition;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyCounterfactualObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations = state.observations.slice(-COUNTERFACTUAL_OBSERVATION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCounterfactualCognition = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCounterfactualCognition = undefined;
    },
  };
  return store;
}

// ─── observation builder ──────────────────────────────────────

export function buildCounterfactualObservation(args: {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  actualLeader: CognitiveSystem | null;
  actualArchetype: CampaignArchetype | null;
  projections: CounterfactualProjection[];
  trustOptimizedArchetype: CampaignArchetype | null;
  durabilityOptimizedArchetype: CampaignArchetype | null;
}): CounterfactualObservation {
  return {
    at: args.at,
    bannerId: args.bannerId,
    formula: args.formula,
    campaignMode: args.campaignMode,
    actualLeader: args.actualLeader,
    actualArchetype: args.actualArchetype,
    projections: args.projections.map((p) => ({
      alternateLeader: p.alternateLeader,
      archetype: p.counterfactualCampaignArchetype,
      trustImpact: p.trustImpact,
      fatigueImpact: p.fatigueImpact,
      durabilityImpact: p.durabilityImpact,
      divergenceFromActual: p.divergenceFromActual,
      plausibility: p.plausibility,
    })),
    trustOptimizedArchetype: args.trustOptimizedArchetype,
    durabilityOptimizedArchetype: args.durabilityOptimizedArchetype,
  };
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordCounterfactualObservation(
  obs: CounterfactualObservation,
): Promise<void> {
  try {
    await createCounterfactualCognitionMemoryStore().append(obs);
  } catch {
    // non-fatal — never blocks generation
  }
}
