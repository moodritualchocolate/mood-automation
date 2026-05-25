/**
 * STRATEGIC OUTCOME MEMORY
 *
 * Persistent FIFO memory of strategic-outcome observations. Same
 * observation stream → same memory state → same intelligence reading.
 *
 * Crucially tracks the relationship between:
 *   - signature presence at run-time, AND
 *   - eventual strategicStability + trustDurability
 *
 * This is what lets the engine surface "resilient patterns" vs
 * "decay patterns" — separating temporary from durable success.
 *
 * STRICTLY observational. Append is the only mutating operation.
 *
 * Lives at data/memory/strategic-outcome-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import {
  ALL_STRATEGIC_SIGNATURES, type StrategicSignature,
  type OutcomeHistoryContext,
} from './strategicOutcomeIntelligence';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'strategic-outcome-memory.json';

export const OUTCOME_OBSERVATION_LIMIT = 96;
export const STABILITY_TRACE_LIMIT = 64;
export const PATTERN_LIMIT = 32;
export const RECENT_WINDOW = 12;

// ─── observation ──────────────────────────────────────────────

export interface StrategicOutcomeObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  /** Per-signature strength this run. */
  signatureStrengths: Record<StrategicSignature, number>;
  /** Dominant signature at run-time (highest durability). */
  dominantSignature: StrategicSignature | null;
  emergingSignatures: StrategicSignature[];
  collapsingSignatures: StrategicSignature[];
  strategicStability: number;
  trustDurability: number;
  audienceResilience: number;
  noveltyFragility: number;
  longTermConsistency: number;
  strategicRisk: number;
  /** Identity vector + governance executive at run-time — used to
   *  derive identity / governance outcome alignment tables. */
  identityVector: string | null;
  governanceExecutive: string | null;
  governanceFingerprint: string;
  /** Cultural audience numbness, used for audience-sensitivity stats. */
  audienceNumbness: number;
  /** Composite decay signal — fragility + erosive + risk averaged. */
  decaySignal: number;
}

export interface StabilityPoint {
  at: number;
  strategicStability: number;
  trustDurability: number;
  strategicRisk: number;
}

// ─── state ─────────────────────────────────────────────────────

export interface StrategicOutcomeMemoryState {
  observations: StrategicOutcomeObservation[];
  /** EWMA per signature. prev * 0.7 + new * 0.3. */
  ewmaStrengths: Record<StrategicSignature, number>;
  /** Per-signature variance accumulator. */
  signatureSumSquaredDev: Record<StrategicSignature, number>;
  /** Per-signature dominance counts. */
  dominanceCounts: Record<StrategicSignature, number>;
  /** Per-signature: strategicStability sum across runs where the
   *  signature was strongly active (strength >= 6). */
  stabilityWhenActiveSum: Record<StrategicSignature, number>;
  stabilityWhenActiveCount: Record<StrategicSignature, number>;
  /** Pattern dictionaries keyed by compact fingerprints. */
  resilientPatternStats: Record<string, { count: number; stabilitySum: number }>;
  decayPatternStats: Record<string, { count: number; decaySum: number }>;
  audiencePatternStats: Record<string, { count: number; numbnessSum: number }>;
  trustCompoundingStats: Record<string, { count: number; trustSum: number }>;
  fatigueResistanceStats: Record<string, { count: number; resistanceSum: number }>;
  /** Identity vector → outcome alignment stats. */
  identityAlignmentStats: Record<string, { count: number; stabilitySum: number; trustSum: number }>;
  /** Governance executive/fingerprint → outcome alignment stats. */
  governanceAlignmentStats: Record<string, { count: number; stabilitySum: number; trustSum: number }>;
  /** Stability trace (FIFO). */
  stabilityTrace: StabilityPoint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function emptyPerSignature<T>(value: T): Record<StrategicSignature, T> {
  const out = {} as Record<StrategicSignature, T>;
  for (const s of ALL_STRATEGIC_SIGNATURES) out[s] = value;
  return out;
}

export function createInitialStrategicOutcomeMemory(): StrategicOutcomeMemoryState {
  return {
    observations: [],
    ewmaStrengths: emptyPerSignature(0),
    signatureSumSquaredDev: emptyPerSignature(0),
    dominanceCounts: emptyPerSignature(0),
    stabilityWhenActiveSum: emptyPerSignature(0),
    stabilityWhenActiveCount: emptyPerSignature(0),
    resilientPatternStats: {},
    decayPatternStats: {},
    audiencePatternStats: {},
    trustCompoundingStats: {},
    fatigueResistanceStats: {},
    identityAlignmentStats: {},
    governanceAlignmentStats: {},
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

function capPatternCounts<T>(table: Record<string, T>, sortKey: (v: T) => number): Record<string, T> {
  if (Object.keys(table).length <= PATTERN_LIMIT) return table;
  const entries = Object.entries(table).sort((a, b) => sortKey(b[1]) - sortKey(a[1])).slice(0, PATTERN_LIMIT);
  return Object.fromEntries(entries);
}

function buildPatternKey(obs: StrategicOutcomeObservation, kind: 'resilient' | 'decay' | 'audience' | 'trust' | 'fatigue'): string {
  const sig = obs.dominantSignature ?? 'none';
  switch (kind) {
    case 'resilient':
    case 'decay':
      return `${sig}@${obs.campaignMode ?? 'auto'}`;
    case 'audience':
      return `${sig}@${obs.campaignMode ?? 'auto'}|num`;
    case 'trust':
      return `${sig}|${obs.governanceExecutive ?? 'none'}`;
    case 'fatigue':
      return `${sig}|${obs.identityVector ?? 'none'}`;
  }
}

export function applyOutcomeObservation(
  state: StrategicOutcomeMemoryState,
  obs: StrategicOutcomeObservation,
): StrategicOutcomeMemoryState {
  // Per-signature EWMA + variance.
  const nextEwma = { ...state.ewmaStrengths };
  const nextDev = { ...state.signatureSumSquaredDev };
  const nextWhenActiveSum = { ...state.stabilityWhenActiveSum };
  const nextWhenActiveCount = { ...state.stabilityWhenActiveCount };
  for (const sig of ALL_STRATEGIC_SIGNATURES) {
    const prev = state.ewmaStrengths[sig];
    const current = obs.signatureStrengths[sig] ?? 0;
    nextEwma[sig] = ewma(prev, current);
    nextDev[sig] = state.signatureSumSquaredDev[sig] * 0.85 + Math.pow(current - prev, 2);
    if (current >= 6) {
      nextWhenActiveSum[sig] = (state.stabilityWhenActiveSum[sig] ?? 0) + obs.strategicStability;
      nextWhenActiveCount[sig] = (state.stabilityWhenActiveCount[sig] ?? 0) + 1;
    }
  }

  // Dominance counts.
  const nextDominance = { ...state.dominanceCounts };
  if (obs.dominantSignature) {
    nextDominance[obs.dominantSignature] = (nextDominance[obs.dominantSignature] ?? 0) + 1;
  }

  // Resilient pattern: high strategic stability + low risk.
  let nextResilient = { ...state.resilientPatternStats };
  if (obs.strategicStability >= 7 && obs.strategicRisk <= 5) {
    const k = buildPatternKey(obs, 'resilient');
    const cur = nextResilient[k] ?? { count: 0, stabilitySum: 0 };
    nextResilient[k] = { count: cur.count + 1, stabilitySum: cur.stabilitySum + obs.strategicStability };
  }
  nextResilient = capPatternCounts(nextResilient, (v) => v.count);

  // Decay pattern: low stability OR high risk.
  let nextDecay = { ...state.decayPatternStats };
  if (obs.strategicStability <= 4 || obs.strategicRisk >= 6) {
    const k = buildPatternKey(obs, 'decay');
    const cur = nextDecay[k] ?? { count: 0, decaySum: 0 };
    nextDecay[k] = { count: cur.count + 1, decaySum: cur.decaySum + obs.decaySignal };
  }
  nextDecay = capPatternCounts(nextDecay, (v) => v.count);

  // Audience-sensitivity pattern (always recorded).
  let nextAudience = { ...state.audiencePatternStats };
  {
    const k = buildPatternKey(obs, 'audience');
    const cur = nextAudience[k] ?? { count: 0, numbnessSum: 0 };
    nextAudience[k] = { count: cur.count + 1, numbnessSum: cur.numbnessSum + obs.audienceNumbness };
  }
  nextAudience = capPatternCounts(nextAudience, (v) => v.count);

  // Trust-compounding pattern: when trust-compounding strength was high.
  let nextTrustCompound = { ...state.trustCompoundingStats };
  if ((obs.signatureStrengths['trust-compounding'] ?? 0) >= 6) {
    const k = buildPatternKey(obs, 'trust');
    const cur = nextTrustCompound[k] ?? { count: 0, trustSum: 0 };
    nextTrustCompound[k] = { count: cur.count + 1, trustSum: cur.trustSum + obs.trustDurability };
  }
  nextTrustCompound = capPatternCounts(nextTrustCompound, (v) => v.count);

  // Fatigue-resistance pattern: when fatigue-resistant was high AND audience numbness stayed low.
  let nextFatigueResist = { ...state.fatigueResistanceStats };
  if ((obs.signatureStrengths['fatigue-resistant'] ?? 0) >= 6 && obs.audienceNumbness <= 4) {
    const k = buildPatternKey(obs, 'fatigue');
    const cur = nextFatigueResist[k] ?? { count: 0, resistanceSum: 0 };
    nextFatigueResist[k] = { count: cur.count + 1, resistanceSum: cur.resistanceSum + obs.audienceResilience };
  }
  nextFatigueResist = capPatternCounts(nextFatigueResist, (v) => v.count);

  // Identity vector → outcome alignment.
  let nextIdentityAlign = { ...state.identityAlignmentStats };
  if (obs.identityVector) {
    const cur = nextIdentityAlign[obs.identityVector] ?? { count: 0, stabilitySum: 0, trustSum: 0 };
    nextIdentityAlign[obs.identityVector] = {
      count: cur.count + 1,
      stabilitySum: cur.stabilitySum + obs.strategicStability,
      trustSum: cur.trustSum + obs.trustDurability,
    };
  }
  nextIdentityAlign = capPatternCounts(nextIdentityAlign, (v) => v.count);

  // Governance executive → outcome alignment (use governance fingerprint).
  let nextGovAlign = { ...state.governanceAlignmentStats };
  {
    const k = obs.governanceFingerprint;
    const cur = nextGovAlign[k] ?? { count: 0, stabilitySum: 0, trustSum: 0 };
    nextGovAlign[k] = {
      count: cur.count + 1,
      stabilitySum: cur.stabilitySum + obs.strategicStability,
      trustSum: cur.trustSum + obs.trustDurability,
    };
  }
  nextGovAlign = capPatternCounts(nextGovAlign, (v) => v.count);

  return {
    observations: [...state.observations, obs].slice(-OUTCOME_OBSERVATION_LIMIT),
    ewmaStrengths: nextEwma,
    signatureSumSquaredDev: nextDev,
    dominanceCounts: nextDominance,
    stabilityWhenActiveSum: nextWhenActiveSum,
    stabilityWhenActiveCount: nextWhenActiveCount,
    resilientPatternStats: nextResilient,
    decayPatternStats: nextDecay,
    audiencePatternStats: nextAudience,
    trustCompoundingStats: nextTrustCompound,
    fatigueResistanceStats: nextFatigueResist,
    identityAlignmentStats: nextIdentityAlign,
    governanceAlignmentStats: nextGovAlign,
    stabilityTrace: [...state.stabilityTrace, {
      at: obs.at,
      strategicStability: obs.strategicStability,
      trustDurability: obs.trustDurability,
      strategicRisk: obs.strategicRisk,
    }].slice(-STABILITY_TRACE_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── history context for the engine ───────────────────────────

export function buildOutcomeHistoryContext(
  state: StrategicOutcomeMemoryState | null,
): OutcomeHistoryContext | null {
  if (!state || state.totalObservations === 0) return null;
  const variance = {} as Partial<Record<StrategicSignature, number>>;
  for (const sig of ALL_STRATEGIC_SIGNATURES) {
    variance[sig] = state.signatureSumSquaredDev[sig] / Math.max(1, Math.min(RECENT_WINDOW, state.totalObservations));
  }
  const stabilityWhenActive = {} as Partial<Record<StrategicSignature, number>>;
  for (const sig of ALL_STRATEGIC_SIGNATURES) {
    const count = state.stabilityWhenActiveCount[sig] ?? 0;
    if (count === 0) continue;
    stabilityWhenActive[sig] = state.stabilityWhenActiveSum[sig] / count;
  }
  const recentStability = (() => {
    const tail = state.stabilityTrace.slice(-8);
    if (tail.length === 0) return 5;
    return tail.reduce((a, p) => a + p.strategicStability, 0) / tail.length;
  })();
  const recentTrust = (() => {
    const tail = state.stabilityTrace.slice(-8);
    if (tail.length === 0) return 5;
    return tail.reduce((a, p) => a + p.trustDurability, 0) / tail.length;
  })();
  return {
    ewmaStrengths: state.ewmaStrengths,
    variance,
    dominanceCounts: state.dominanceCounts,
    stabilityWhenActive,
    resilientPatternStats: state.resilientPatternStats,
    decayPatternStats: state.decayPatternStats,
    audiencePatternStats: state.audiencePatternStats,
    trustCompoundingStats: state.trustCompoundingStats,
    fatigueResistanceStats: state.fatigueResistanceStats,
    identityAlignmentStats: state.identityAlignmentStats,
    governanceAlignmentStats: state.governanceAlignmentStats,
    observationCount: state.totalObservations,
    recentStrategicStability: recentStability,
    recentTrustDurability: recentTrust,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodStrategicOutcome?: StrategicOutcomeMemoryState };

export interface StrategicOutcomeMemoryStore {
  read(): Promise<StrategicOutcomeMemoryState>;
  append(obs: StrategicOutcomeObservation): Promise<StrategicOutcomeMemoryState>;
  save(state: StrategicOutcomeMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createStrategicOutcomeMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): StrategicOutcomeMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: StrategicOutcomeMemoryStore = {
    async read() {
      if (g.__moodStrategicOutcome) return g.__moodStrategicOutcome;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<StrategicOutcomeMemoryState>;
        g.__moodStrategicOutcome = {
          ...createInitialStrategicOutcomeMemory(),
          ...parsed,
          ewmaStrengths:             { ...emptyPerSignature(0), ...(parsed.ewmaStrengths ?? {}) },
          signatureSumSquaredDev:    { ...emptyPerSignature(0), ...(parsed.signatureSumSquaredDev ?? {}) },
          dominanceCounts:           { ...emptyPerSignature(0), ...(parsed.dominanceCounts ?? {}) },
          stabilityWhenActiveSum:    { ...emptyPerSignature(0), ...(parsed.stabilityWhenActiveSum ?? {}) },
          stabilityWhenActiveCount:  { ...emptyPerSignature(0), ...(parsed.stabilityWhenActiveCount ?? {}) },
        };
      } catch {
        g.__moodStrategicOutcome = createInitialStrategicOutcomeMemory();
      }
      return g.__moodStrategicOutcome;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyOutcomeObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations   = state.observations.slice(-OUTCOME_OBSERVATION_LIMIT);
      state.stabilityTrace = state.stabilityTrace.slice(-STABILITY_TRACE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodStrategicOutcome = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodStrategicOutcome = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordOutcomeObservation(
  obs: StrategicOutcomeObservation,
): Promise<void> {
  try {
    await createStrategicOutcomeMemoryStore().append(obs);
  } catch {
    // non-fatal — never blocks generation
  }
}
