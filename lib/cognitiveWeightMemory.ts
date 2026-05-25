/**
 * COGNITIVE WEIGHT MEMORY (Dynamic Cognitive Weight Evolution — Phase Next)
 *
 * Persistent FIFO memory of per-system weight observations. Lets the
 * evolution engine compute drift + volatility per cognitive system,
 * and the longitudinal view surface authority transitions across time.
 *
 * STRICTLY:
 *   - read-only perception input (no runtime mutation of generation)
 *   - deterministic — append is the only mutating operation
 *   - no external APIs / model calls
 *   - write failure is non-fatal (caller swallows)
 *
 * Lives at data/memory/cognitive-weight-memory.json. FIFO-capped.
 *
 * Same observation stream → same memory state → same evolution.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import {
  ALL_COGNITIVE_SYSTEMS, type CognitiveSystem,
  type CognitiveWeightHistoryContext,
} from './cognitiveWeightEvolution';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'cognitive-weight-memory.json';

export const WEIGHT_OBSERVATION_LIMIT = 96;
export const FRAGMENTATION_TRACE_LIMIT = 64;
export const RECENT_WINDOW = 12;

// ─── observation ──────────────────────────────────────────────

export interface CognitiveWeightObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  weights: Record<CognitiveSystem, number>;
  globalStability: number;
  adaptationPressure: number;
  cognitiveFragmentation: number;
  dominantSystem: CognitiveSystem | null;
  suppressedSystems: CognitiveSystem[];
}

export interface FragmentationPoint {
  at: number;
  globalStability: number;
  adaptationPressure: number;
  cognitiveFragmentation: number;
}

// ─── state ─────────────────────────────────────────────────────

export interface CognitiveWeightMemoryState {
  observations: CognitiveWeightObservation[];
  /** EWMA per cognitive system. prev*0.7 + new*0.3 — slow drift. */
  ewmaWeights: Record<CognitiveSystem, number>;
  /** How many times each system was top of dominantSystems. */
  dominanceCounts: Record<CognitiveSystem, number>;
  /** How many times each system landed in suppressedSystems. */
  suppressionCounts: Record<CognitiveSystem, number>;
  /** Per-system rolling sum of squared deviations from EWMA — used to
   *  derive variance over the recent window deterministically. */
  weightSumSquaredDev: Record<CognitiveSystem, number>;
  /** Stability/fragmentation trace for the longitudinal view. */
  fragmentationTrace: FragmentationPoint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function emptyPerSystem<T>(value: T): Record<CognitiveSystem, T> {
  const out = {} as Record<CognitiveSystem, T>;
  for (const s of ALL_COGNITIVE_SYSTEMS) out[s] = value;
  return out;
}

export function createInitialCognitiveWeightMemory(): CognitiveWeightMemoryState {
  return {
    observations: [],
    ewmaWeights: emptyPerSystem(5),
    dominanceCounts: emptyPerSystem(0),
    suppressionCounts: emptyPerSystem(0),
    weightSumSquaredDev: emptyPerSystem(0),
    fragmentationTrace: [],
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

/** EWMA: prev * 0.7 + new * 0.3. */
function ewma(prev: number, current: number): number {
  return prev * 0.7 + current * 0.3;
}

export function applyWeightObservation(
  state: CognitiveWeightMemoryState, obs: CognitiveWeightObservation,
): CognitiveWeightMemoryState {
  const nextEwma = { ...state.ewmaWeights };
  const nextDev = { ...state.weightSumSquaredDev };
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const prev = state.ewmaWeights[s];
    const current = obs.weights[s] ?? 5;
    nextEwma[s] = ewma(prev, current);
    // Accumulate squared deviation from the (pre-update) EWMA so the
    // variance is a stable rolling moment.
    nextDev[s] = state.weightSumSquaredDev[s] * 0.85 + Math.pow(current - prev, 2);
  }
  const nextDominance = { ...state.dominanceCounts };
  if (obs.dominantSystem) {
    nextDominance[obs.dominantSystem] = (nextDominance[obs.dominantSystem] ?? 0) + 1;
  }
  const nextSuppression = { ...state.suppressionCounts };
  for (const s of obs.suppressedSystems) {
    nextSuppression[s] = (nextSuppression[s] ?? 0) + 1;
  }
  return {
    observations: [...state.observations, obs].slice(-WEIGHT_OBSERVATION_LIMIT),
    ewmaWeights: nextEwma,
    dominanceCounts: nextDominance,
    suppressionCounts: nextSuppression,
    weightSumSquaredDev: nextDev,
    fragmentationTrace: [...state.fragmentationTrace, {
      at: obs.at,
      globalStability: obs.globalStability,
      adaptationPressure: obs.adaptationPressure,
      cognitiveFragmentation: obs.cognitiveFragmentation,
    }].slice(-FRAGMENTATION_TRACE_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── memory → history context for the engine ─────────────────

export function buildHistoryContext(
  state: CognitiveWeightMemoryState | null,
): CognitiveWeightHistoryContext | null {
  if (!state || state.totalObservations === 0) return null;
  // Per-system variance estimate from accumulated squared deviation.
  const variance = {} as Partial<Record<CognitiveSystem, number>>;
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    // Normalize the EWMA-weighted accumulator into a 0..high variance.
    variance[s] = state.weightSumSquaredDev[s] / Math.max(1, Math.min(RECENT_WINDOW, state.totalObservations));
  }
  const recentFrag = (() => {
    const tail = state.fragmentationTrace.slice(-8);
    if (tail.length === 0) return 0;
    return tail.reduce((a, p) => a + p.cognitiveFragmentation, 0) / tail.length;
  })();
  return {
    ewmaWeights: state.ewmaWeights,
    variance,
    observationCount: state.totalObservations,
    recentFragmentation: recentFrag,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCognitiveWeight?: CognitiveWeightMemoryState };

export interface CognitiveWeightMemoryStore {
  read(): Promise<CognitiveWeightMemoryState>;
  append(obs: CognitiveWeightObservation): Promise<CognitiveWeightMemoryState>;
  save(state: CognitiveWeightMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCognitiveWeightMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CognitiveWeightMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CognitiveWeightMemoryStore = {
    async read() {
      if (g.__moodCognitiveWeight) return g.__moodCognitiveWeight;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CognitiveWeightMemoryState>;
        // Defensive merge — ensure all CognitiveSystem keys exist.
        g.__moodCognitiveWeight = {
          ...createInitialCognitiveWeightMemory(),
          ...parsed,
          ewmaWeights:         { ...emptyPerSystem(5), ...(parsed.ewmaWeights ?? {}) },
          dominanceCounts:     { ...emptyPerSystem(0), ...(parsed.dominanceCounts ?? {}) },
          suppressionCounts:   { ...emptyPerSystem(0), ...(parsed.suppressionCounts ?? {}) },
          weightSumSquaredDev: { ...emptyPerSystem(0), ...(parsed.weightSumSquaredDev ?? {}) },
        };
      } catch {
        g.__moodCognitiveWeight = createInitialCognitiveWeightMemory();
      }
      return g.__moodCognitiveWeight;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyWeightObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations       = state.observations.slice(-WEIGHT_OBSERVATION_LIMIT);
      state.fragmentationTrace = state.fragmentationTrace.slice(-FRAGMENTATION_TRACE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCognitiveWeight = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCognitiveWeight = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordCognitiveWeightObservation(
  obs: CognitiveWeightObservation,
): Promise<void> {
  try {
    await createCognitiveWeightMemoryStore().append(obs);
  } catch {
    // non-fatal — never blocks generation
  }
}
