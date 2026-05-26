/**
 * PROJECTION CALIBRATION ENGINE
 *
 * Pure deterministic ANNOTATIONS layer. Reads branch-activation memory
 * + (optionally) prior calibration snapshots, produces calibration
 * annotations per counterfactual projection type — historical accuracy,
 * bias direction, environmental reliability — WITHOUT ever modifying
 * the projections themselves.
 *
 * This is epistemic calibration. NOT autonomous correction.
 *
 * STRICTLY:
 *   - never modifies projections / scores / branch rankings
 *   - never auto-adjusts outcomes / weights
 *   - no hidden score modification
 *   - no external APIs / model calls
 *   - same memory → same annotations
 *
 * Imports: only data types. No critic/pipeline imports.
 */

import type {
  BranchActivationMemoryState, BranchActivationRecord,
} from './branchActivationMemory';
import type {
  ProjectionCalibrationMemoryState,
} from './projectionCalibrationMemory';

// ─── output shape ──────────────────────────────────────────────

export interface EnvironmentalSensitivity {
  highFatigue: number;
  lowTrust: number;
  highNovelty: number;
  stableAudience: number;
  fragmentedAudience: number;
}

export interface PredictionDriftPoint {
  expected: number;
  actual: number;
  delta: number;
}

export interface ProjectionCalibration {
  projectionType: string;

  historicalAccuracy: number;
  shortTermAccuracy: number;
  longTermAccuracy: number;

  overestimationBias: number;
  underestimationBias: number;

  trustCalibration: number;
  fatigueCalibration: number;
  durabilityCalibration: number;

  sampleSize: number;
  confidenceLevel: number;

  environmentalSensitivity: EnvironmentalSensitivity;

  calibrationAnnotations: string[];
  predictionDrift: PredictionDriftPoint[];

  reasonCodes: string[];
}

export interface ProjectionCalibrationReport {
  overallConfidence: number;
  overallAccuracy: number;
  mostReliableProjectionType: string | null;
  leastReliableProjectionType: string | null;
  calibrations: ProjectionCalibration[];
  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface ProjectionCalibrationInput {
  branchActivationMemory: BranchActivationMemoryState | null;
  calibrationMemory?: ProjectionCalibrationMemoryState | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── environment classification ───────────────────────────────

const NOVELTY_BRANCHES = new Set([
  'novelty-surge', 'viral-instability', 'high-curiosity-hook-heavy',
]);

interface EnvClassification {
  highFatigue: boolean;
  lowTrust: boolean;
  highNovelty: boolean;
  stableAudience: boolean;
  fragmentedAudience: boolean;
}

function classifyEnvironment(r: BranchActivationRecord): EnvClassification {
  return {
    highFatigue: r.baselineFatiguePressure >= 7,
    lowTrust: r.baselineTrustMomentum <= 4,
    highNovelty: NOVELTY_BRANCHES.has(r.branchName),
    stableAudience: r.baselineFatiguePressure <= 4 && r.baselineTrustMomentum >= 6,
    fragmentedAudience: r.fromPhase === 'needs-rest' || r.fromPhase === 'needs-branch',
  };
}

// ─── per-axis error (measured vs predicted) ───────────────────

interface AxisError {
  trustError: number;        // |predicted - measured|
  fatigueError: number;
  durabilityError: number;
  trustOver: number;         // predicted - measured if positive (overestimate)
  fatigueOver: number;
  durabilityOver: number;
  trustUnder: number;        // measured - predicted if positive (underestimate)
  fatigueUnder: number;
  durabilityUnder: number;
}

function deriveAxisError(r: BranchActivationRecord): AxisError | null {
  if (!r.resolved || r.observationsAfter === 0) return null;
  const measuredTrust = r.measuredTrustDelta / r.observationsAfter;
  const measuredFatigue = r.measuredFatigueDelta / r.observationsAfter;
  const measuredDurability = r.measuredDurabilityDelta / r.observationsAfter;
  const trustDelta = r.predictedTrustImpact - measuredTrust;
  const fatigueDelta = r.predictedFatigueImpact - measuredFatigue;
  const durabilityDelta = r.predictedDurabilityImpact - measuredDurability;
  return {
    trustError: Math.abs(trustDelta),
    fatigueError: Math.abs(fatigueDelta),
    durabilityError: Math.abs(durabilityDelta),
    trustOver: Math.max(0, trustDelta),
    fatigueOver: Math.max(0, fatigueDelta),
    durabilityOver: Math.max(0, durabilityDelta),
    trustUnder: Math.max(0, -trustDelta),
    fatigueUnder: Math.max(0, -fatigueDelta),
    durabilityUnder: Math.max(0, -durabilityDelta),
  };
}

// ─── per-projection-type calibration ──────────────────────────

interface TypeBucket {
  records: BranchActivationRecord[];
  errors: AxisError[];
  envCounts: {
    highFatigue: number;
    lowTrust: number;
    highNovelty: number;
    stableAudience: number;
    fragmentedAudience: number;
  };
  envErrorSums: {
    highFatigue: number;
    lowTrust: number;
    highNovelty: number;
    stableAudience: number;
    fragmentedAudience: number;
  };
}

function emptyBucket(): TypeBucket {
  return {
    records: [], errors: [],
    envCounts: { highFatigue: 0, lowTrust: 0, highNovelty: 0, stableAudience: 0, fragmentedAudience: 0 },
    envErrorSums: { highFatigue: 0, lowTrust: 0, highNovelty: 0, stableAudience: 0, fragmentedAudience: 0 },
  };
}

function computePerType(
  type: string, bucket: TypeBucket, calibrationMemory: ProjectionCalibrationMemoryState | null | undefined,
): ProjectionCalibration {
  const reasonCodes: string[] = [];
  const sampleSize = bucket.records.length;

  if (sampleSize === 0) {
    return {
      projectionType: type,
      historicalAccuracy: 0, shortTermAccuracy: 0, longTermAccuracy: 0,
      overestimationBias: 0, underestimationBias: 0,
      trustCalibration: 0, fatigueCalibration: 0, durabilityCalibration: 0,
      sampleSize: 0, confidenceLevel: 0,
      environmentalSensitivity: {
        highFatigue: 0, lowTrust: 0, highNovelty: 0, stableAudience: 0, fragmentedAudience: 0,
      },
      calibrationAnnotations: ['no resolved activations of this projection type yet — calibration not yet established'],
      predictionDrift: [],
      reasonCodes: ['no-samples'],
    };
  }

  // Per-axis average errors → calibration scores (10 - avg error).
  const avgTrustError       = avg(bucket.errors.map((e) => e.trustError));
  const avgFatigueError     = avg(bucket.errors.map((e) => e.fatigueError));
  const avgDurabilityError  = avg(bucket.errors.map((e) => e.durabilityError));

  const trustCalibration       = round1(clamp10(10 - avgTrustError * 1.2));
  const fatigueCalibration     = round1(clamp10(10 - avgFatigueError * 1.2));
  const durabilityCalibration  = round1(clamp10(10 - avgDurabilityError * 1.2));

  const historicalAccuracy = round1(
    (trustCalibration + fatigueCalibration + durabilityCalibration) / 3,
  );

  // Bias direction: overestimation = avg predicted > avg measured.
  const trustOverAvg       = avg(bucket.errors.map((e) => e.trustOver));
  const trustUnderAvg      = avg(bucket.errors.map((e) => e.trustUnder));
  const fatigueOverAvg     = avg(bucket.errors.map((e) => e.fatigueOver));
  const fatigueUnderAvg    = avg(bucket.errors.map((e) => e.fatigueUnder));
  const durabilityOverAvg  = avg(bucket.errors.map((e) => e.durabilityOver));
  const durabilityUnderAvg = avg(bucket.errors.map((e) => e.durabilityUnder));

  // Bias = max single-axis overage (× 1.2) — a single strong over-axis
  // surfaces clearly rather than being diluted by zero-bias axes.
  const overestimationBias = round1(clamp10(
    Math.max(trustOverAvg, fatigueOverAvg, durabilityOverAvg) * 1.2,
  ));
  const underestimationBias = round1(clamp10(
    Math.max(trustUnderAvg, fatigueUnderAvg, durabilityUnderAvg) * 1.2,
  ));

  // Short-term vs long-term accuracy proxy:
  //   short = first half of records (chronological)
  //   long  = second half
  const halfIdx = Math.floor(sampleSize / 2);
  const earlyErrs = bucket.errors.slice(0, halfIdx);
  const lateErrs  = bucket.errors.slice(halfIdx);
  const shortAvgErr = earlyErrs.length > 0
    ? avg([avg(earlyErrs.map((e) => e.trustError)),
           avg(earlyErrs.map((e) => e.fatigueError)),
           avg(earlyErrs.map((e) => e.durabilityError))])
    : avg([avgTrustError, avgFatigueError, avgDurabilityError]);
  const longAvgErr = lateErrs.length > 0
    ? avg([avg(lateErrs.map((e) => e.trustError)),
           avg(lateErrs.map((e) => e.fatigueError)),
           avg(lateErrs.map((e) => e.durabilityError))])
    : avg([avgTrustError, avgFatigueError, avgDurabilityError]);
  const shortTermAccuracy = round1(clamp10(10 - shortAvgErr * 1.2));
  const longTermAccuracy  = round1(clamp10(10 - longAvgErr * 1.2));

  // Confidence: rises with sample size, falls with high variance.
  const errVariance = avg(bucket.errors.map((e) => {
    const mean = (avgTrustError + avgFatigueError + avgDurabilityError) / 3;
    const local = (e.trustError + e.fatigueError + e.durabilityError) / 3;
    return Math.pow(local - mean, 2);
  }));
  const confidenceLevel = round1(clamp10(
    Math.min(sampleSize * 0.8, 5) + (10 - errVariance * 2) * 0.5,
  ));

  // Environmental sensitivity — accuracy under each environment kind.
  const envSensitivity = {
    highFatigue:          bucket.envCounts.highFatigue          > 0 ? round1(clamp10(10 - (bucket.envErrorSums.highFatigue          / bucket.envCounts.highFatigue)          * 1.2)) : 0,
    lowTrust:             bucket.envCounts.lowTrust             > 0 ? round1(clamp10(10 - (bucket.envErrorSums.lowTrust             / bucket.envCounts.lowTrust)             * 1.2)) : 0,
    highNovelty:          bucket.envCounts.highNovelty          > 0 ? round1(clamp10(10 - (bucket.envErrorSums.highNovelty          / bucket.envCounts.highNovelty)          * 1.2)) : 0,
    stableAudience:       bucket.envCounts.stableAudience       > 0 ? round1(clamp10(10 - (bucket.envErrorSums.stableAudience       / bucket.envCounts.stableAudience)       * 1.2)) : 0,
    fragmentedAudience:   bucket.envCounts.fragmentedAudience   > 0 ? round1(clamp10(10 - (bucket.envErrorSums.fragmentedAudience   / bucket.envCounts.fragmentedAudience)   * 1.2)) : 0,
  };

  // Annotations.
  const calibrationAnnotations = buildAnnotations({
    type,
    sampleSize,
    overestimationBias,
    underestimationBias,
    trustOverAvg, trustUnderAvg,
    fatigueOverAvg, fatigueUnderAvg,
    durabilityOverAvg, durabilityUnderAvg,
    envSensitivity,
    envCounts: bucket.envCounts,
    historicalAccuracy,
    shortTermAccuracy,
    longTermAccuracy,
  });

  // Prediction drift trace — recent up-to-8 records.
  const predictionDrift: PredictionDriftPoint[] = bucket.records.slice(-8).map((r) => {
    const measured = (r.observationsAfter > 0)
      ? (r.measuredTrustDelta + r.measuredDurabilityDelta) / r.observationsAfter / 2
      : 0;
    const expected = (r.predictedTrustImpact + r.predictedDurabilityImpact) / 2;
    return {
      expected: round1(expected),
      actual: round1(measured),
      delta: round1(measured - expected),
    };
  });

  // Calibration trajectory bonus: if memory has prior snapshots for this
  // type and accuracy improved → annotate.
  if (calibrationMemory) {
    const prior = calibrationMemory.perTypeAccuracyTrajectory[type];
    if (prior && prior.length >= 2) {
      const earliest = prior[0];
      const latest = prior[prior.length - 1];
      const drift = latest - earliest;
      if (drift >= 1) {
        calibrationAnnotations.push(`calibration improving: ${earliest.toFixed(1)} → ${latest.toFixed(1)}/10`);
      } else if (drift <= -1) {
        calibrationAnnotations.push(`calibration degrading: ${earliest.toFixed(1)} → ${latest.toFixed(1)}/10`);
      }
    }
  }

  reasonCodes.push(
    `samples:${sampleSize}`,
    `trust-error:${round1(avgTrustError)}`,
    `fatigue-error:${round1(avgFatigueError)}`,
    `durability-error:${round1(avgDurabilityError)}`,
    `overestimation-bias:${overestimationBias}`,
    `underestimation-bias:${underestimationBias}`,
  );

  return {
    projectionType: type,
    historicalAccuracy,
    shortTermAccuracy,
    longTermAccuracy,
    overestimationBias,
    underestimationBias,
    trustCalibration,
    fatigueCalibration,
    durabilityCalibration,
    sampleSize,
    confidenceLevel,
    environmentalSensitivity: envSensitivity,
    calibrationAnnotations,
    predictionDrift,
    reasonCodes,
  };
}

// ─── annotation builder ──────────────────────────────────────

interface AnnotationContext {
  type: string;
  sampleSize: number;
  overestimationBias: number;
  underestimationBias: number;
  trustOverAvg: number;
  trustUnderAvg: number;
  fatigueOverAvg: number;
  fatigueUnderAvg: number;
  durabilityOverAvg: number;
  durabilityUnderAvg: number;
  envSensitivity: EnvironmentalSensitivity;
  envCounts: TypeBucket['envCounts'];
  historicalAccuracy: number;
  shortTermAccuracy: number;
  longTermAccuracy: number;
}

function buildAnnotations(ctx: AnnotationContext): string[] {
  const out: string[] = [];

  if (ctx.sampleSize < 3) {
    out.push(`small sample (n=${ctx.sampleSize}) — annotations should be read cautiously`);
  }

  // Overestimation per axis when bias is non-trivial.
  if (ctx.trustOverAvg >= 1) {
    out.push(`historically overestimates trust impact by +${ctx.trustOverAvg.toFixed(1)} on average`);
  }
  if (ctx.trustUnderAvg >= 1) {
    out.push(`historically underestimates trust impact by -${ctx.trustUnderAvg.toFixed(1)} on average`);
  }
  if (ctx.fatigueOverAvg >= 1) {
    out.push(`historically overestimates fatigue impact by +${ctx.fatigueOverAvg.toFixed(1)}`);
  }
  if (ctx.fatigueUnderAvg >= 1) {
    out.push(`historically underestimates fatigue impact by -${ctx.fatigueUnderAvg.toFixed(1)}`);
  }
  if (ctx.durabilityOverAvg >= 1) {
    out.push(`historically overestimates durability impact by +${ctx.durabilityOverAvg.toFixed(1)}`);
  }
  if (ctx.durabilityUnderAvg >= 1) {
    out.push(`historically underestimates durability impact by -${ctx.durabilityUnderAvg.toFixed(1)}`);
  }

  // Short vs long-term divergence.
  if (Math.abs(ctx.shortTermAccuracy - ctx.longTermAccuracy) >= 1.5) {
    if (ctx.shortTermAccuracy > ctx.longTermAccuracy) {
      out.push(`accurate short-term (${ctx.shortTermAccuracy}/10), weak long-term (${ctx.longTermAccuracy}/10)`);
    } else {
      out.push(`weak short-term (${ctx.shortTermAccuracy}/10), more accurate long-term (${ctx.longTermAccuracy}/10)`);
    }
  }

  // Environmental reliability.
  if (ctx.envCounts.highFatigue >= 2 && ctx.envSensitivity.highFatigue >= 7) {
    out.push(`historically accurate under high-fatigue environments (${ctx.envSensitivity.highFatigue}/10, n=${ctx.envCounts.highFatigue})`);
  }
  if (ctx.envCounts.lowTrust >= 2 && ctx.envSensitivity.lowTrust >= 7) {
    out.push(`historically accurate under low-trust environments (${ctx.envSensitivity.lowTrust}/10, n=${ctx.envCounts.lowTrust})`);
  }
  if (ctx.envCounts.highFatigue >= 2 && ctx.envSensitivity.highFatigue <= 4) {
    out.push(`historically inaccurate under high-fatigue environments (${ctx.envSensitivity.highFatigue}/10)`);
  }
  if (ctx.envCounts.lowTrust >= 2 && ctx.envSensitivity.lowTrust <= 4) {
    out.push(`historically inaccurate under low-trust environments (${ctx.envSensitivity.lowTrust}/10)`);
  }

  if (out.length === 0) {
    out.push(`calibration neutral — predictions track reality within tolerance`);
  }
  return out.slice(0, 8);
}

// ─── main ──────────────────────────────────────────────────────

export function computeProjectionCalibration(
  input: ProjectionCalibrationInput,
): ProjectionCalibrationReport {
  const ba = input.branchActivationMemory;
  if (!ba || ba.totalActivations === 0) {
    return {
      overallConfidence: 0,
      overallAccuracy: 0,
      mostReliableProjectionType: null,
      leastReliableProjectionType: null,
      calibrations: [],
      reasonCodes: ['no-branch-activation-history'],
    };
  }

  // Bucket resolved activations by counterfactual type.
  const buckets = new Map<string, TypeBucket>();
  for (const r of ba.activations) {
    if (!r.resolved) continue;
    const err = deriveAxisError(r);
    if (!err) continue;
    const type = r.counterfactualType || 'unspecified';
    const b = buckets.get(type) ?? emptyBucket();
    b.records.push(r);
    b.errors.push(err);
    const env = classifyEnvironment(r);
    const combinedErr = (err.trustError + err.fatigueError + err.durabilityError) / 3;
    if (env.highFatigue)         { b.envCounts.highFatigue          += 1; b.envErrorSums.highFatigue          += combinedErr; }
    if (env.lowTrust)            { b.envCounts.lowTrust             += 1; b.envErrorSums.lowTrust             += combinedErr; }
    if (env.highNovelty)         { b.envCounts.highNovelty          += 1; b.envErrorSums.highNovelty          += combinedErr; }
    if (env.stableAudience)      { b.envCounts.stableAudience       += 1; b.envErrorSums.stableAudience       += combinedErr; }
    if (env.fragmentedAudience)  { b.envCounts.fragmentedAudience   += 1; b.envErrorSums.fragmentedAudience   += combinedErr; }
    buckets.set(type, b);
  }

  const calibrations: ProjectionCalibration[] = [];
  for (const [type, bucket] of buckets.entries()) {
    calibrations.push(computePerType(type, bucket, input.calibrationMemory));
  }

  // Sort by historicalAccuracy descending (most reliable first).
  calibrations.sort((a, b) => b.historicalAccuracy - a.historicalAccuracy);

  // Overall scalars.
  const totalSamples = calibrations.reduce((a, c) => a + c.sampleSize, 0);
  const overallAccuracy = totalSamples === 0 ? 0 : round1(
    calibrations.reduce((a, c) => a + c.historicalAccuracy * c.sampleSize, 0) / totalSamples,
  );
  const overallConfidence = totalSamples === 0 ? 0 : round1(
    calibrations.reduce((a, c) => a + c.confidenceLevel * c.sampleSize, 0) / totalSamples,
  );

  const mostReliableProjectionType = calibrations[0]?.projectionType ?? null;
  const leastReliableProjectionType = calibrations.length > 1
    ? calibrations[calibrations.length - 1].projectionType
    : null;

  return {
    overallConfidence,
    overallAccuracy,
    mostReliableProjectionType,
    leastReliableProjectionType,
    calibrations,
    reasonCodes: [
      `projection-types:${calibrations.length}`,
      `resolved-activations:${totalSamples}`,
      `overall-accuracy:${overallAccuracy}`,
      `overall-confidence:${overallConfidence}`,
    ],
  };
}
