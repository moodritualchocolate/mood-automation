/**
 * IDENTITY CONTINUITY LONGITUDINAL VIEW
 *
 * Read-only analyzer over the identity continuity memory + a current
 * identity snapshot. Surfaces:
 *
 *   - what identity is becoming dominant
 *   - what identity is collapsing
 *   - which behaviors persist regardless of audience
 *   - which behaviors only appear under pressure
 *   - continuity trajectory
 *   - fragmentation trajectory
 *   - adaptation eras
 *   - recurring behavioral fingerprints
 *   - identity transitions over time
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  IdentityContinuityMemoryState, IdentityObservation, StabilityPoint,
} from './identityContinuityMemory';
import {
  ALL_IDENTITY_VECTORS, type IdentityVector,
  type IdentityContinuity,
} from './identityContinuityEngine';

// ─── shape ─────────────────────────────────────────────────────

export interface VectorDominanceRow {
  vector: IdentityVector;
  count: number;
  share: number;
  ewmaStrength: number;
}

export interface CollapsingVectorRow {
  vector: IdentityVector;
  historicalStrength: number;
  recentStrength: number;
  decay: number;
}

export interface IdentityTransitionRow {
  fromVector: IdentityVector;
  toVector: IdentityVector;
  count: number;
}

export interface BehavioralFingerprintRow {
  pattern: string;
  count: number;
  share: number;
}

export interface PressureOnlyVectorRow {
  vector: IdentityVector;
  pressureAppearances: number;       // collapseCounts + emergenceCounts — only-under-pressure
  dominanceAppearances: number;
  ratio: number;                     // pressureAppearances / max(1, dominanceAppearances)
}

export interface ContinuityTrendPoint {
  at: number;
  identityStability: number;
  identityFragmentation: number;
  behavioralConsistency: number;
  continuityRisk: number;
}

export type ContinuityTrend = 'no-history' | 'establishing' | 'stable' | 'rising-fragmentation' | 'consolidating';

export interface AdaptationEra {
  startedAt: number;
  endedAt: number;
  dominantVector: IdentityVector;
  observationCount: number;
}

export interface IdentityContinuityLongitudinalView {
  present: boolean;
  statement: string;
  continuityTrend: ContinuityTrend;

  totalObservations: number;
  averageStability: number;
  averageFragmentation: number;
  averageConsistency: number;
  averageContinuityRisk: number;

  current: IdentityContinuity | null;

  dominantOverTime: VectorDominanceRow[];
  collapsingOverTime: CollapsingVectorRow[];
  identityTransitions: IdentityTransitionRow[];
  recurringBehavioralFingerprints: BehavioralFingerprintRow[];
  /** Vectors that show up under pressure (emergence + collapse) more
   *  than they dominate — behaviors that "only appear under pressure". */
  pressureOnlyVectors: PressureOnlyVectorRow[];
  /** Vectors with high persistence regardless of audience/mode. */
  audienceAgnosticVectors: VectorDominanceRow[];
  continuityTrace: ContinuityTrendPoint[];
  adaptationEras: AdaptationEra[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── derivations ───────────────────────────────────────────────

function classifyContinuity(trace: StabilityPoint[]): ContinuityTrend {
  if (trace.length === 0) return 'no-history';
  if (trace.length < 4) return 'establishing';
  const half = Math.floor(trace.length / 2);
  const earlyFrag = avg(trace.slice(0, half).map((p) => p.identityFragmentation));
  const recentFrag = avg(trace.slice(half).map((p) => p.identityFragmentation));
  const fragDelta = recentFrag - earlyFrag;
  if (fragDelta > 0.8) return 'rising-fragmentation';
  if (fragDelta < -0.8) return 'consolidating';
  return 'stable';
}

function dominantOverTime(state: IdentityContinuityMemoryState): VectorDominanceRow[] {
  const total = Object.values(state.dominanceCounts).reduce((a, b) => a + b, 0);
  return ALL_IDENTITY_VECTORS
    .map((v) => ({
      vector: v,
      count: state.dominanceCounts[v] ?? 0,
      share: total > 0 ? round2((state.dominanceCounts[v] ?? 0) / total) : 0,
      ewmaStrength: round1(state.ewmaStrengths[v] ?? 0),
    }))
    .filter((r) => r.count > 0 || r.ewmaStrength >= 3)
    .sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : b.ewmaStrength - a.ewmaStrength,
    )
    .slice(0, 8);
}

function collapsingOverTime(state: IdentityContinuityMemoryState): CollapsingVectorRow[] {
  const recent = state.observations.slice(-12);
  if (recent.length < 3) return [];
  return ALL_IDENTITY_VECTORS
    .map((v) => {
      const historical = round1(state.ewmaStrengths[v] ?? 0);
      const recentAvg = round1(avg(recent.map((o) => o.vectorStrengths[v] ?? 0)));
      return {
        vector: v,
        historicalStrength: historical,
        recentStrength: recentAvg,
        decay: round1(historical - recentAvg),
      };
    })
    .filter((r) => r.decay >= 0.6)
    .sort((a, b) => b.decay - a.decay)
    .slice(0, 5);
}

function identityTransitions(state: IdentityContinuityMemoryState): IdentityTransitionRow[] {
  const observations = state.observations;
  if (observations.length < 2) return [];
  const counts = new Map<string, number>();
  for (let i = 1; i < observations.length; i++) {
    const prev = observations[i - 1].dominantVector;
    const cur  = observations[i].dominantVector;
    if (!prev || !cur || prev === cur) continue;
    const key = `${prev}→${cur}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [fromVector, toVector] = key.split('→') as [IdentityVector, IdentityVector];
      return { fromVector, toVector, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function recurringFingerprints(state: IdentityContinuityMemoryState): BehavioralFingerprintRow[] {
  const total = Object.values(state.patternCounts).reduce((a, b) => a + b, 0);
  return Object.entries(state.patternCounts)
    .map(([pattern, count]) => ({
      pattern, count,
      share: total > 0 ? round2(count / total) : 0,
    }))
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function pressureOnlyVectors(state: IdentityContinuityMemoryState): PressureOnlyVectorRow[] {
  return ALL_IDENTITY_VECTORS
    .map((v) => {
      const pressure = (state.emergenceCounts[v] ?? 0) + (state.collapseCounts[v] ?? 0);
      const dominance = state.dominanceCounts[v] ?? 0;
      return {
        vector: v,
        pressureAppearances: pressure,
        dominanceAppearances: dominance,
        ratio: round2(pressure / Math.max(1, dominance)),
      };
    })
    .filter((r) => r.pressureAppearances >= 2 && r.ratio >= 1.5)
    .sort((a, b) => b.ratio - a.ratio || b.pressureAppearances - a.pressureAppearances)
    .slice(0, 5);
}

function audienceAgnosticVectors(state: IdentityContinuityMemoryState): VectorDominanceRow[] {
  // High EWMA + dominance count across runs regardless of mode = audience-agnostic.
  return ALL_IDENTITY_VECTORS
    .map((v) => ({
      vector: v,
      count: state.dominanceCounts[v] ?? 0,
      share: 0,
      ewmaStrength: round1(state.ewmaStrengths[v] ?? 0),
    }))
    .filter((r) => r.ewmaStrength >= 6)
    .sort((a, b) => b.ewmaStrength - a.ewmaStrength)
    .slice(0, 4);
}

/** Adaptation eras: contiguous runs where a single vector dominated.
 *  Emits one entry per era with at least 2 observations. */
function adaptationEras(state: IdentityContinuityMemoryState): AdaptationEra[] {
  const eras: AdaptationEra[] = [];
  const obs = state.observations;
  let i = 0;
  while (i < obs.length) {
    const startVector = obs[i].dominantVector;
    if (!startVector) { i++; continue; }
    let j = i;
    while (j < obs.length && obs[j].dominantVector === startVector) j++;
    const length = j - i;
    if (length >= 2) {
      eras.push({
        startedAt: obs[i].at,
        endedAt: obs[j - 1].at,
        dominantVector: startVector,
        observationCount: length,
      });
    }
    i = j;
  }
  return eras.slice(-8);
}

// ─── main builder ──────────────────────────────────────────────

export interface IdentityContinuityViewInput {
  memory: IdentityContinuityMemoryState | null;
  current?: IdentityContinuity | null;
}

export function buildIdentityContinuityLongitudinalView(
  input: IdentityContinuityViewInput,
): IdentityContinuityLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no identity continuity history yet — the system has not yet developed observable selfhood',
      continuityTrend: 'no-history',
      totalObservations: 0,
      averageStability: 5,
      averageFragmentation: 0,
      averageConsistency: 5,
      averageContinuityRisk: 0,
      current: input.current ?? null,
      dominantOverTime: [],
      collapsingOverTime: [],
      identityTransitions: [],
      recurringBehavioralFingerprints: [],
      pressureOnlyVectors: [],
      audienceAgnosticVectors: [],
      continuityTrace: [],
      adaptationEras: [],
    };
  }

  const observations = mem.observations;
  const total = mem.totalObservations;

  const averageStability     = round1(avg(observations.map((o) => o.identityStability)));
  const averageFragmentation = round1(avg(observations.map((o) => o.identityFragmentation)));
  const averageConsistency   = round1(avg(observations.map((o) => o.behavioralConsistency)));
  const averageContinuityRisk= round1(avg(observations.map((o) => o.continuityRisk)));

  const continuityTrace: ContinuityTrendPoint[] = mem.stabilityTrace
    .slice(-24)
    .map((p) => ({
      at: p.at,
      identityStability: round1(p.identityStability),
      identityFragmentation: round1(p.identityFragmentation),
      behavioralConsistency: round1(p.behavioralConsistency),
      continuityRisk: round1(p.continuityRisk),
    }));

  const continuityTrend = classifyContinuity(mem.stabilityTrace);

  const statement = (() => {
    if (continuityTrend === 'rising-fragmentation') {
      return `identity fragmentation rising — selfhood destabilizing across ${total} observations`;
    }
    if (continuityTrend === 'consolidating') {
      return `identity consolidating — behavioral signatures stabilizing across ${total} observations`;
    }
    if (continuityTrend === 'stable') {
      return `persistent identity stable — average continuity-risk ${averageContinuityRisk.toFixed(1)}/10 across ${total} observations`;
    }
    return `establishing baseline identity — ${total} observation(s) recorded`;
  })();

  return {
    present: true,
    statement,
    continuityTrend,
    totalObservations: total,
    averageStability,
    averageFragmentation,
    averageConsistency,
    averageContinuityRisk,
    current: input.current ?? null,
    dominantOverTime: dominantOverTime(mem),
    collapsingOverTime: collapsingOverTime(mem),
    identityTransitions: identityTransitions(mem),
    recurringBehavioralFingerprints: recurringFingerprints(mem),
    pressureOnlyVectors: pressureOnlyVectors(mem),
    audienceAgnosticVectors: audienceAgnosticVectors(mem),
    continuityTrace,
    adaptationEras: adaptationEras(mem),
  };
}
