/**
 * STRATEGIC OUTCOME LONGITUDINAL VIEW
 *
 * Read-only analyzer over strategic-outcome memory + a current
 * intelligence snapshot. Surfaces:
 *
 *   - which structures survive longest
 *   - which structures decay fastest
 *   - trust accumulation trajectory
 *   - fatigue accumulation trajectory
 *   - resilient governance structures
 *   - resilient identity signatures
 *   - audience synchronization patterns
 *   - strategic erosion patterns
 *   - long-term strategic drift
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  StrategicOutcomeMemoryState, StrategicOutcomeObservation, StabilityPoint,
} from './strategicOutcomeMemory';
import {
  ALL_STRATEGIC_SIGNATURES, type StrategicSignature,
  type StrategicOutcomeIntelligence,
} from './strategicOutcomeIntelligence';

// ─── shape ─────────────────────────────────────────────────────

export interface SignatureLongevityRow {
  signature: StrategicSignature;
  count: number;
  ewmaStrength: number;
  averageStabilityWhenActive: number;
}

export interface FastDecayRow {
  signature: StrategicSignature;
  historicalStrength: number;
  recentStrength: number;
  decay: number;
}

export interface TrustTrajectoryPoint {
  at: number;
  trustDurability: number;
}

export interface FatigueAccumulationPoint {
  at: number;
  audienceNumbness: number;
}

export interface ResilientStructureRow {
  pattern: string;
  count: number;
  averageStability: number;
}

export interface ErosionPatternRow {
  pattern: string;
  count: number;
  averageDecay: number;
}

export interface AudienceSyncRow {
  pattern: string;
  count: number;
  averageNumbness: number;
}

export interface StrategicDriftPoint {
  at: number;
  strategicStability: number;
  strategicRisk: number;
}

export type StrategicTrend =
  | 'no-history' | 'establishing' | 'stable' | 'eroding' | 'consolidating';

export interface StrategicOutcomeLongitudinalView {
  present: boolean;
  statement: string;
  strategicTrend: StrategicTrend;

  totalObservations: number;
  averageStability: number;
  averageTrustDurability: number;
  averageStrategicRisk: number;

  current: StrategicOutcomeIntelligence | null;

  longestSurvivingStructures: SignatureLongevityRow[];
  fastestDecayingStructures: FastDecayRow[];
  trustAccumulationTrajectory: TrustTrajectoryPoint[];
  fatigueAccumulationTrajectory: FatigueAccumulationPoint[];
  resilientGovernanceStructures: ResilientStructureRow[];
  resilientIdentitySignatures: ResilientStructureRow[];
  audienceSynchronizationPatterns: AudienceSyncRow[];
  strategicErosionPatterns: ErosionPatternRow[];
  strategicDriftTrace: StrategicDriftPoint[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── derivations ───────────────────────────────────────────────

function classifyStrategicTrend(trace: StabilityPoint[]): StrategicTrend {
  if (trace.length === 0) return 'no-history';
  if (trace.length < 4) return 'establishing';
  const half = Math.floor(trace.length / 2);
  const early = avg(trace.slice(0, half).map((p) => p.strategicStability));
  const recent = avg(trace.slice(half).map((p) => p.strategicStability));
  const delta = recent - early;
  if (delta > 0.8) return 'consolidating';
  if (delta < -0.8) return 'eroding';
  return 'stable';
}

function longestSurvivingStructures(state: StrategicOutcomeMemoryState): SignatureLongevityRow[] {
  return ALL_STRATEGIC_SIGNATURES
    .map((sig) => {
      const count = state.dominanceCounts[sig] ?? 0;
      const ewma = round1(state.ewmaStrengths[sig] ?? 0);
      const stabCount = state.stabilityWhenActiveCount[sig] ?? 0;
      const stabSum = state.stabilityWhenActiveSum[sig] ?? 0;
      const stabAvg = stabCount > 0 ? round1(stabSum / stabCount) : 0;
      return {
        signature: sig,
        count,
        ewmaStrength: ewma,
        averageStabilityWhenActive: stabAvg,
      };
    })
    .filter((r) => r.count >= 2 || r.ewmaStrength >= 5)
    .sort((a, b) =>
      b.averageStabilityWhenActive !== a.averageStabilityWhenActive
        ? b.averageStabilityWhenActive - a.averageStabilityWhenActive
        : b.count - a.count,
    )
    .slice(0, 6);
}

function fastestDecayingStructures(state: StrategicOutcomeMemoryState): FastDecayRow[] {
  const recent = state.observations.slice(-12);
  if (recent.length < 3) return [];
  return ALL_STRATEGIC_SIGNATURES
    .map((sig) => {
      const historical = round1(state.ewmaStrengths[sig] ?? 0);
      const recentAvg = round1(avg(recent.map((o) => o.signatureStrengths[sig] ?? 0)));
      return {
        signature: sig,
        historicalStrength: historical,
        recentStrength: recentAvg,
        decay: round1(historical - recentAvg),
      };
    })
    .filter((r) => r.decay >= 0.8)
    .sort((a, b) => b.decay - a.decay)
    .slice(0, 5);
}

function trustAccumulationTrajectory(state: StrategicOutcomeMemoryState): TrustTrajectoryPoint[] {
  return state.stabilityTrace.slice(-24).map((p) => ({
    at: p.at,
    trustDurability: round1(p.trustDurability),
  }));
}

function fatigueAccumulationTrajectory(state: StrategicOutcomeMemoryState): FatigueAccumulationPoint[] {
  return state.observations.slice(-24).map((o) => ({
    at: o.at,
    audienceNumbness: round1(o.audienceNumbness),
  }));
}

function resilientGovernanceStructures(state: StrategicOutcomeMemoryState): ResilientStructureRow[] {
  return Object.entries(state.governanceAlignmentStats)
    .map(([pattern, { count, stabilitySum }]) => ({
      pattern, count,
      averageStability: round1(stabilitySum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2 && r.averageStability >= 6)
    .sort((a, b) => b.averageStability - a.averageStability)
    .slice(0, 5);
}

function resilientIdentitySignatures(state: StrategicOutcomeMemoryState): ResilientStructureRow[] {
  return Object.entries(state.identityAlignmentStats)
    .map(([pattern, { count, stabilitySum }]) => ({
      pattern, count,
      averageStability: round1(stabilitySum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2 && r.averageStability >= 6)
    .sort((a, b) => b.averageStability - a.averageStability)
    .slice(0, 5);
}

function audienceSynchronizationPatterns(state: StrategicOutcomeMemoryState): AudienceSyncRow[] {
  return Object.entries(state.audiencePatternStats)
    .map(([pattern, { count, numbnessSum }]) => ({
      pattern, count,
      averageNumbness: round1(numbnessSum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2)
    .sort((a, b) => a.averageNumbness - b.averageNumbness)
    .slice(0, 5);
}

function strategicErosionPatterns(state: StrategicOutcomeMemoryState): ErosionPatternRow[] {
  return Object.entries(state.decayPatternStats)
    .map(([pattern, { count, decaySum }]) => ({
      pattern, count,
      averageDecay: round1(decaySum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.averageDecay - a.averageDecay)
    .slice(0, 5);
}

// ─── main builder ──────────────────────────────────────────────

export interface StrategicOutcomeViewInput {
  memory: StrategicOutcomeMemoryState | null;
  current?: StrategicOutcomeIntelligence | null;
}

export function buildStrategicOutcomeLongitudinalView(
  input: StrategicOutcomeViewInput,
): StrategicOutcomeLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no strategic outcome history yet — long-term persuasion intelligence has not formed',
      strategicTrend: 'no-history',
      totalObservations: 0,
      averageStability: 5,
      averageTrustDurability: 5,
      averageStrategicRisk: 0,
      current: input.current ?? null,
      longestSurvivingStructures: [],
      fastestDecayingStructures: [],
      trustAccumulationTrajectory: [],
      fatigueAccumulationTrajectory: [],
      resilientGovernanceStructures: [],
      resilientIdentitySignatures: [],
      audienceSynchronizationPatterns: [],
      strategicErosionPatterns: [],
      strategicDriftTrace: [],
    };
  }

  const observations = mem.observations;
  const total = mem.totalObservations;

  const averageStability      = round1(avg(observations.map((o) => o.strategicStability)));
  const averageTrustDurability= round1(avg(observations.map((o) => o.trustDurability)));
  const averageStrategicRisk  = round1(avg(observations.map((o) => o.strategicRisk)));

  const strategicDriftTrace: StrategicDriftPoint[] = mem.stabilityTrace
    .slice(-24)
    .map((p) => ({
      at: p.at,
      strategicStability: round1(p.strategicStability),
      strategicRisk: round1(p.strategicRisk),
    }));

  const strategicTrend = classifyStrategicTrend(mem.stabilityTrace);

  const statement = (() => {
    if (strategicTrend === 'eroding') {
      return `strategic foundation eroding — long-term resilience trending down across ${total} observations`;
    }
    if (strategicTrend === 'consolidating') {
      return `strategic foundation consolidating — durable patterns accumulating across ${total} observations`;
    }
    if (strategicTrend === 'stable') {
      return `strategic foundation stable — average stability ${averageStability.toFixed(1)}/10, trust durability ${averageTrustDurability.toFixed(1)}/10`;
    }
    return `establishing strategic outcome baseline — ${total} observation(s) recorded`;
  })();

  return {
    present: true,
    statement,
    strategicTrend,
    totalObservations: total,
    averageStability,
    averageTrustDurability,
    averageStrategicRisk,
    current: input.current ?? null,
    longestSurvivingStructures: longestSurvivingStructures(mem),
    fastestDecayingStructures: fastestDecayingStructures(mem),
    trustAccumulationTrajectory: trustAccumulationTrajectory(mem),
    fatigueAccumulationTrajectory: fatigueAccumulationTrajectory(mem),
    resilientGovernanceStructures: resilientGovernanceStructures(mem),
    resilientIdentitySignatures: resilientIdentitySignatures(mem),
    audienceSynchronizationPatterns: audienceSynchronizationPatterns(mem),
    strategicErosionPatterns: strategicErosionPatterns(mem),
    strategicDriftTrace,
  };
}
