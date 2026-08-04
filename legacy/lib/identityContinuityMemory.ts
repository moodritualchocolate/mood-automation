/**
 * IDENTITY CONTINUITY MEMORY (Persistent Identity Continuity Engine)
 *
 * Persistent FIFO memory of identity observations. Same observation
 * stream → same memory state → same identity reading.
 *
 * STRICTLY:
 *   - read-only perception input (no generation mutation)
 *   - deterministic — append is the only mutating operation
 *   - no external APIs / model calls
 *   - write failure is non-fatal (caller swallows)
 *
 * Lives at data/memory/identity-continuity-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import {
  ALL_IDENTITY_VECTORS, type IdentityVector,
  type IdentityHistoryContext,
} from './identityContinuityEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'identity-continuity-memory.json';

export const IDENTITY_OBSERVATION_LIMIT = 96;
export const STABILITY_TRACE_LIMIT = 64;
export const RECENT_WINDOW = 12;
export const PATTERN_LIMIT = 32;

// ─── observation ──────────────────────────────────────────────

export interface IdentityObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  vectorStrengths: Record<IdentityVector, number>;
  identityStability: number;
  identityFragmentation: number;
  behavioralConsistency: number;
  adaptationVelocity: number;
  continuityRisk: number;
  dominantVector: IdentityVector | null;
  emergingVectors: IdentityVector[];
  collapsingVectors: IdentityVector[];
  contradictionCount: number;
}

export interface StabilityPoint {
  at: number;
  identityStability: number;
  identityFragmentation: number;
  behavioralConsistency: number;
  continuityRisk: number;
}

// ─── state ─────────────────────────────────────────────────────

export interface IdentityContinuityMemoryState {
  observations: IdentityObservation[];
  /** EWMA per identity vector. prev * 0.7 + new * 0.3. */
  ewmaStrengths: Record<IdentityVector, number>;
  /** Per-vector accumulated squared deviation (rolling variance proxy). */
  strengthSumSquaredDev: Record<IdentityVector, number>;
  /** How many times each vector was the dominant identity. */
  dominanceCounts: Record<IdentityVector, number>;
  /** How many times each vector appeared in emergingVectors. */
  emergenceCounts: Record<IdentityVector, number>;
  /** How many times each vector appeared in collapsingVectors. */
  collapseCounts: Record<IdentityVector, number>;
  /** Compact recurring behavioral-pattern counts (top-vector fingerprints). */
  patternCounts: Record<string, number>;
  /** Stability / fragmentation trace. */
  stabilityTrace: StabilityPoint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function emptyPerVector<T>(value: T): Record<IdentityVector, T> {
  const out = {} as Record<IdentityVector, T>;
  for (const v of ALL_IDENTITY_VECTORS) out[v] = value;
  return out;
}

export function createInitialIdentityContinuityMemory(): IdentityContinuityMemoryState {
  return {
    observations: [],
    ewmaStrengths: emptyPerVector(0),
    strengthSumSquaredDev: emptyPerVector(0),
    dominanceCounts: emptyPerVector(0),
    emergenceCounts: emptyPerVector(0),
    collapseCounts: emptyPerVector(0),
    patternCounts: {},
    stabilityTrace: [],
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function ewma(prev: number, current: number): number {
  return prev * 0.7 + current * 0.3;
}

/** Build a compact pattern fingerprint from the dominant + top emerging
 *  vector, so recurring identity expressions can be counted across time. */
function patternFingerprint(obs: IdentityObservation): string {
  const top = obs.dominantVector ?? 'none';
  const second = obs.emergingVectors[0] ?? 'none';
  return `${top}+${second}@${obs.campaignMode ?? 'auto'}`;
}

export function applyIdentityObservation(
  state: IdentityContinuityMemoryState,
  obs: IdentityObservation,
): IdentityContinuityMemoryState {
  const nextEwma = { ...state.ewmaStrengths };
  const nextDev = { ...state.strengthSumSquaredDev };
  for (const v of ALL_IDENTITY_VECTORS) {
    const prev = state.ewmaStrengths[v];
    const current = obs.vectorStrengths[v] ?? 0;
    nextEwma[v] = ewma(prev, current);
    nextDev[v] = state.strengthSumSquaredDev[v] * 0.85 + Math.pow(current - prev, 2);
  }
  const nextDominance = { ...state.dominanceCounts };
  if (obs.dominantVector) {
    nextDominance[obs.dominantVector] = (nextDominance[obs.dominantVector] ?? 0) + 1;
  }
  const nextEmergence = { ...state.emergenceCounts };
  for (const v of obs.emergingVectors) {
    nextEmergence[v] = (nextEmergence[v] ?? 0) + 1;
  }
  const nextCollapse = { ...state.collapseCounts };
  for (const v of obs.collapsingVectors) {
    nextCollapse[v] = (nextCollapse[v] ?? 0) + 1;
  }

  // Pattern bookkeeping — cap distinct keys so memory file stays small.
  const fp = patternFingerprint(obs);
  let nextPatterns = { ...state.patternCounts, [fp]: (state.patternCounts[fp] ?? 0) + 1 };
  if (Object.keys(nextPatterns).length > PATTERN_LIMIT) {
    // Keep the top-N by count + most-recent insertion (deterministic by sort).
    const entries = Object.entries(nextPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, PATTERN_LIMIT);
    nextPatterns = Object.fromEntries(entries);
  }

  return {
    observations: [...state.observations, obs].slice(-IDENTITY_OBSERVATION_LIMIT),
    ewmaStrengths: nextEwma,
    strengthSumSquaredDev: nextDev,
    dominanceCounts: nextDominance,
    emergenceCounts: nextEmergence,
    collapseCounts: nextCollapse,
    patternCounts: nextPatterns,
    stabilityTrace: [...state.stabilityTrace, {
      at: obs.at,
      identityStability: obs.identityStability,
      identityFragmentation: obs.identityFragmentation,
      behavioralConsistency: obs.behavioralConsistency,
      continuityRisk: obs.continuityRisk,
    }].slice(-STABILITY_TRACE_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── history context for the engine ───────────────────────────

export function buildIdentityHistoryContext(
  state: IdentityContinuityMemoryState | null,
): IdentityHistoryContext | null {
  if (!state || state.totalObservations === 0) return null;
  const variance = {} as Partial<Record<IdentityVector, number>>;
  for (const v of ALL_IDENTITY_VECTORS) {
    variance[v] = state.strengthSumSquaredDev[v] / Math.max(1, Math.min(RECENT_WINDOW, state.totalObservations));
  }
  const recentFrag = (() => {
    const tail = state.stabilityTrace.slice(-8);
    if (tail.length === 0) return 0;
    return tail.reduce((a, p) => a + p.identityFragmentation, 0) / tail.length;
  })();
  const recentStab = (() => {
    const tail = state.stabilityTrace.slice(-8);
    if (tail.length === 0) return 5;
    return tail.reduce((a, p) => a + p.identityStability, 0) / tail.length;
  })();
  return {
    ewmaStrengths: state.ewmaStrengths,
    variance,
    dominanceCounts: state.dominanceCounts,
    observationCount: state.totalObservations,
    recentFragmentation: recentFrag,
    recentStability: recentStab,
    patternCounts: state.patternCounts,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodIdentityContinuity?: IdentityContinuityMemoryState };

export interface IdentityContinuityMemoryStore {
  read(): Promise<IdentityContinuityMemoryState>;
  append(obs: IdentityObservation): Promise<IdentityContinuityMemoryState>;
  save(state: IdentityContinuityMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createIdentityContinuityMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): IdentityContinuityMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: IdentityContinuityMemoryStore = {
    async read() {
      if (g.__moodIdentityContinuity) return g.__moodIdentityContinuity;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<IdentityContinuityMemoryState>;
        g.__moodIdentityContinuity = {
          ...createInitialIdentityContinuityMemory(),
          ...parsed,
          ewmaStrengths:         { ...emptyPerVector(0), ...(parsed.ewmaStrengths ?? {}) },
          strengthSumSquaredDev: { ...emptyPerVector(0), ...(parsed.strengthSumSquaredDev ?? {}) },
          dominanceCounts:       { ...emptyPerVector(0), ...(parsed.dominanceCounts ?? {}) },
          emergenceCounts:       { ...emptyPerVector(0), ...(parsed.emergenceCounts ?? {}) },
          collapseCounts:        { ...emptyPerVector(0), ...(parsed.collapseCounts ?? {}) },
        };
      } catch {
        g.__moodIdentityContinuity = createInitialIdentityContinuityMemory();
      }
      return g.__moodIdentityContinuity;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyIdentityObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations    = state.observations.slice(-IDENTITY_OBSERVATION_LIMIT);
      state.stabilityTrace  = state.stabilityTrace.slice(-STABILITY_TRACE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodIdentityContinuity = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodIdentityContinuity = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordIdentityObservation(
  obs: IdentityObservation,
): Promise<void> {
  try {
    await createIdentityContinuityMemoryStore().append(obs);
  } catch {
    // non-fatal — never blocks generation
  }
}
