/**
 * PROJECTION CALIBRATION LONGITUDINAL VIEW
 *
 * Read-only analyzer over calibration memory + current calibration
 * report. Surfaces:
 *
 *   - most accurate projection types
 *   - least reliable projection types
 *   - strongest long-term predictors
 *   - strongest short-term predictors
 *   - overconfidence patterns
 *   - underconfidence patterns
 *   - calibration drift over time
 *   - environmental reliability maps
 *   - projection trust ranking
 *   - simulation vs reality divergence
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  ProjectionCalibrationMemoryState, CalibrationSnapshot,
} from './projectionCalibrationMemory';
import type {
  ProjectionCalibrationReport, ProjectionCalibration,
} from './projectionCalibrationEngine';

// ─── shape ─────────────────────────────────────────────────────

export interface AccuracyRankingRow {
  projectionType: string;
  historicalAccuracy: number;
  sampleSize: number;
}

export interface TermAccuracyRow {
  projectionType: string;
  shortTermAccuracy: number;
  longTermAccuracy: number;
  divergence: number;
}

export interface ConfidencePatternRow {
  projectionType: string;
  bias: number;
  axis: 'trust' | 'fatigue' | 'durability' | 'composite';
  direction: 'over' | 'under';
}

export interface DriftPoint {
  at: number;
  overallAccuracy: number;
}

export interface PerTypeDriftRow {
  projectionType: string;
  trajectory: number[];
  earliest: number;
  latest: number;
  drift: number;
}

export interface EnvironmentReliabilityRow {
  projectionType: string;
  environment: string;
  reliability: number;
}

export interface DivergenceRow {
  projectionType: string;
  divergence: number;        // 10 - historicalAccuracy
  sampleSize: number;
}

export type CalibrationTrend =
  | 'no-history' | 'establishing'
  | 'calibration-improving' | 'calibration-degrading' | 'calibration-stable';

export interface ProjectionCalibrationLongitudinalView {
  present: boolean;
  statement: string;
  trend: CalibrationTrend;

  totalSnapshots: number;

  current: ProjectionCalibrationReport | null;

  mostAccurate: AccuracyRankingRow[];
  leastReliable: AccuracyRankingRow[];
  strongestLongTermPredictors: TermAccuracyRow[];
  strongestShortTermPredictors: TermAccuracyRow[];

  overconfidencePatterns: ConfidencePatternRow[];
  underconfidencePatterns: ConfidencePatternRow[];

  overallAccuracyDrift: DriftPoint[];
  perTypeDrift: PerTypeDriftRow[];

  environmentalReliabilityMap: EnvironmentReliabilityRow[];

  simulationVsRealityDivergence: DivergenceRow[];
  projectionTrustRanking: AccuracyRankingRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── trend classifier ────────────────────────────────────────

function classifyTrend(state: ProjectionCalibrationMemoryState): CalibrationTrend {
  if (state.totalSnapshots === 0) return 'no-history';
  if (state.snapshots.length < 4) return 'establishing';
  const tail = state.snapshots.slice(-12);
  const half = Math.floor(tail.length / 2);
  const early = avg(tail.slice(0, half).map((s) => s.overallAccuracy));
  const recent = avg(tail.slice(half).map((s) => s.overallAccuracy));
  const delta = recent - early;
  if (delta > 0.6) return 'calibration-improving';
  if (delta < -0.6) return 'calibration-degrading';
  return 'calibration-stable';
}

// ─── derivations ──────────────────────────────────────────────

function mostAccurate(calibrations: ProjectionCalibration[]): AccuracyRankingRow[] {
  return calibrations
    .filter((c) => c.sampleSize >= 1)
    .map((c) => ({
      projectionType: c.projectionType,
      historicalAccuracy: c.historicalAccuracy,
      sampleSize: c.sampleSize,
    }))
    .sort((a, b) =>
      b.historicalAccuracy !== a.historicalAccuracy
        ? b.historicalAccuracy - a.historicalAccuracy
        : b.sampleSize - a.sampleSize,
    )
    .slice(0, 5);
}

function leastReliable(calibrations: ProjectionCalibration[]): AccuracyRankingRow[] {
  return calibrations
    .filter((c) => c.sampleSize >= 1)
    .map((c) => ({
      projectionType: c.projectionType,
      historicalAccuracy: c.historicalAccuracy,
      sampleSize: c.sampleSize,
    }))
    .sort((a, b) => a.historicalAccuracy - b.historicalAccuracy)
    .slice(0, 4);
}

function strongestLongTermPredictors(calibrations: ProjectionCalibration[]): TermAccuracyRow[] {
  return calibrations
    .filter((c) => c.sampleSize >= 2)
    .map((c) => ({
      projectionType: c.projectionType,
      shortTermAccuracy: c.shortTermAccuracy,
      longTermAccuracy: c.longTermAccuracy,
      divergence: round1(c.shortTermAccuracy - c.longTermAccuracy),
    }))
    .sort((a, b) => b.longTermAccuracy - a.longTermAccuracy)
    .slice(0, 4);
}

function strongestShortTermPredictors(calibrations: ProjectionCalibration[]): TermAccuracyRow[] {
  return calibrations
    .filter((c) => c.sampleSize >= 2)
    .map((c) => ({
      projectionType: c.projectionType,
      shortTermAccuracy: c.shortTermAccuracy,
      longTermAccuracy: c.longTermAccuracy,
      divergence: round1(c.shortTermAccuracy - c.longTermAccuracy),
    }))
    .sort((a, b) => b.shortTermAccuracy - a.shortTermAccuracy)
    .slice(0, 4);
}

function overconfidencePatterns(calibrations: ProjectionCalibration[]): ConfidencePatternRow[] {
  return calibrations
    .filter((c) => c.overestimationBias >= 3)
    .map((c) => ({
      projectionType: c.projectionType,
      bias: c.overestimationBias,
      axis: 'composite' as const,
      direction: 'over' as const,
    }))
    .sort((a, b) => b.bias - a.bias)
    .slice(0, 5);
}

function underconfidencePatterns(calibrations: ProjectionCalibration[]): ConfidencePatternRow[] {
  return calibrations
    .filter((c) => c.underestimationBias >= 3)
    .map((c) => ({
      projectionType: c.projectionType,
      bias: c.underestimationBias,
      axis: 'composite' as const,
      direction: 'under' as const,
    }))
    .sort((a, b) => b.bias - a.bias)
    .slice(0, 5);
}

function overallAccuracyDrift(state: ProjectionCalibrationMemoryState): DriftPoint[] {
  return state.snapshots.slice(-24).map((s) => ({
    at: s.at,
    overallAccuracy: round1(s.overallAccuracy),
  }));
}

function perTypeDrift(state: ProjectionCalibrationMemoryState): PerTypeDriftRow[] {
  const out: PerTypeDriftRow[] = [];
  for (const [type, trajectory] of Object.entries(state.perTypeAccuracyTrajectory)) {
    if (trajectory.length < 2) continue;
    const earliest = trajectory[0];
    const latest = trajectory[trajectory.length - 1];
    out.push({
      projectionType: type,
      trajectory: trajectory.map(round1),
      earliest: round1(earliest),
      latest: round1(latest),
      drift: round1(latest - earliest),
    });
  }
  return out.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift)).slice(0, 6);
}

function environmentalReliabilityMap(calibrations: ProjectionCalibration[]): EnvironmentReliabilityRow[] {
  const out: EnvironmentReliabilityRow[] = [];
  for (const c of calibrations) {
    if (c.sampleSize < 2) continue;
    const envs = c.environmentalSensitivity;
    // Push each non-zero environment reading.
    if (envs.highFatigue > 0) out.push({ projectionType: c.projectionType, environment: 'high-fatigue', reliability: envs.highFatigue });
    if (envs.lowTrust > 0) out.push({ projectionType: c.projectionType, environment: 'low-trust', reliability: envs.lowTrust });
    if (envs.highNovelty > 0) out.push({ projectionType: c.projectionType, environment: 'high-novelty', reliability: envs.highNovelty });
    if (envs.stableAudience > 0) out.push({ projectionType: c.projectionType, environment: 'stable-audience', reliability: envs.stableAudience });
    if (envs.fragmentedAudience > 0) out.push({ projectionType: c.projectionType, environment: 'fragmented-audience', reliability: envs.fragmentedAudience });
  }
  return out.sort((a, b) => b.reliability - a.reliability).slice(0, 10);
}

function simulationVsRealityDivergence(calibrations: ProjectionCalibration[]): DivergenceRow[] {
  return calibrations
    .filter((c) => c.sampleSize >= 1)
    .map((c) => ({
      projectionType: c.projectionType,
      divergence: round1(10 - c.historicalAccuracy),
      sampleSize: c.sampleSize,
    }))
    .sort((a, b) => b.divergence - a.divergence)
    .slice(0, 5);
}

function projectionTrustRanking(calibrations: ProjectionCalibration[]): AccuracyRankingRow[] {
  // Trust ranking blends accuracy AND confidence + sample size.
  return calibrations
    .filter((c) => c.sampleSize >= 1)
    .map((c) => ({
      projectionType: c.projectionType,
      historicalAccuracy: round1(
        (c.historicalAccuracy * 0.6 + c.confidenceLevel * 0.4),
      ),
      sampleSize: c.sampleSize,
    }))
    .sort((a, b) => b.historicalAccuracy - a.historicalAccuracy)
    .slice(0, 5);
}

// ─── main builder ──────────────────────────────────────────────

export interface ProjectionCalibrationViewInput {
  memory: ProjectionCalibrationMemoryState | null;
  current?: ProjectionCalibrationReport | null;
}

export function buildProjectionCalibrationLongitudinalView(
  input: ProjectionCalibrationViewInput,
): ProjectionCalibrationLongitudinalView {
  const mem = input.memory;
  const current = input.current ?? null;
  const calibrations = current?.calibrations ?? [];

  if (!mem || mem.totalSnapshots === 0) {
    // First-ever rendering — current report may still exist (computed
    // directly from branch-activation memory) even before any snapshot
    // has been written. Surface what we can.
    return {
      present: calibrations.length > 0,
      statement: calibrations.length > 0
        ? `calibration baseline emerging — ${calibrations.length} projection type(s) measured against reality`
        : 'no projection calibration history yet — annotations require resolved activations',
      trend: 'no-history',
      totalSnapshots: 0,
      current,
      mostAccurate: mostAccurate(calibrations),
      leastReliable: leastReliable(calibrations),
      strongestLongTermPredictors: strongestLongTermPredictors(calibrations),
      strongestShortTermPredictors: strongestShortTermPredictors(calibrations),
      overconfidencePatterns: overconfidencePatterns(calibrations),
      underconfidencePatterns: underconfidencePatterns(calibrations),
      overallAccuracyDrift: [],
      perTypeDrift: [],
      environmentalReliabilityMap: environmentalReliabilityMap(calibrations),
      simulationVsRealityDivergence: simulationVsRealityDivergence(calibrations),
      projectionTrustRanking: projectionTrustRanking(calibrations),
    };
  }

  const trend = classifyTrend(mem);

  const statement = (() => {
    switch (trend) {
      case 'calibration-improving':
        return `calibration improving — overall accuracy trending up across ${mem.totalSnapshots} snapshot(s)`;
      case 'calibration-degrading':
        return `calibration degrading — overall accuracy trending down across ${mem.totalSnapshots} snapshot(s)`;
      case 'calibration-stable':
        return `calibration stable — overall accuracy steady across ${mem.totalSnapshots} snapshot(s)`;
      default:
        return `establishing calibration baseline — ${mem.totalSnapshots} snapshot(s) recorded`;
    }
  })();

  return {
    present: true,
    statement,
    trend,
    totalSnapshots: mem.totalSnapshots,
    current,
    mostAccurate: mostAccurate(calibrations),
    leastReliable: leastReliable(calibrations),
    strongestLongTermPredictors: strongestLongTermPredictors(calibrations),
    strongestShortTermPredictors: strongestShortTermPredictors(calibrations),
    overconfidencePatterns: overconfidencePatterns(calibrations),
    underconfidencePatterns: underconfidencePatterns(calibrations),
    overallAccuracyDrift: overallAccuracyDrift(mem),
    perTypeDrift: perTypeDrift(mem),
    environmentalReliabilityMap: environmentalReliabilityMap(calibrations),
    simulationVsRealityDivergence: simulationVsRealityDivergence(calibrations),
    projectionTrustRanking: projectionTrustRanking(calibrations),
  };
}

// Re-export the snapshot helper so the route can build snapshots
// without importing it directly from memory.
export type { CalibrationSnapshot };
