/**
 * BRANCH ACTIVATION LOG
 *
 * Deterministic, read-only analyzer over the branch-activation memory.
 * Tracks which suggested branches humans actually chose, and whether
 * reality validated those decisions — strategic reinforcement memory,
 * NOT autonomous optimization.
 *
 * STRICTLY:
 *   - no autonomous branch execution / campaign switching
 *   - no automatic prompt rewriting / budget changes / publishing
 *   - no runtime mutation / self-modification
 *   - no external APIs / model calls
 *   - branches can ONLY activate when an operator POSTs explicitly
 *
 * The engine itself is a PURE analyzer. The POST endpoint records the
 * operator's choice; subsequent generation runs update outcome deltas
 * read-only.
 */

import type {
  BranchActivationMemoryState, BranchActivationRecord,
  PerBranchOutcomeAggregate,
} from './branchActivationMemory';

// ─── output shape ──────────────────────────────────────────────

export interface OperatorPattern {
  operatorType: string;
  preferredBranches: string[];
  riskTolerance: number;
  trustBias: number;
  noveltyBias: number;
}

export interface BranchOutcomeRow {
  branchName: string;
  timesActivated: number;
  successfulRecoveries: number;
  trustRecoveryRate: number;       // 0..10 — successfulRecoveries × trust direction
  fatigueRecoveryRate: number;
  durabilityGain: number;
  averageDecayReduction: number;
  longTermStability: number;
}

export interface FailedBranchPattern {
  branchName: string;
  failurePattern: string;
  severity: number;
}

export interface DurableBranchPattern {
  branchName: string;
  durabilityScore: number;
  reason: string;
}

export interface ProjectionAccuracyRow {
  counterfactualType: string;
  historicalAccuracy: number;
  sampleSize: number;
}

export interface ActivationTimelineRow {
  phase: string;
  branch: string;
  result: string;
  durabilityDelta: number;
  trustDelta: number;
  fatigueDelta: number;
}

export interface BranchActivationLog {
  activationConfidence: number;
  historicalReliability: number;
  branchTrustworthiness: number;
  predictionAccuracy: number;

  operatorPatterns: OperatorPattern[];
  branchOutcomes: BranchOutcomeRow[];
  failedBranchPatterns: FailedBranchPattern[];
  durableBranchPatterns: DurableBranchPattern[];
  projectionAccuracy: ProjectionAccuracyRow[];
  activationTimeline: ActivationTimelineRow[];

  recommendedObservations: string[];

  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface BranchActivationLogInput {
  memory: BranchActivationMemoryState | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── per-branch outcome rows ──────────────────────────────────

function buildBranchOutcomes(state: BranchActivationMemoryState): BranchOutcomeRow[] {
  return Object.entries(state.perBranch)
    .map(([branchName, agg]) => buildOutcomeRow(branchName, agg))
    .filter((r) => r.timesActivated > 0)
    .sort((a, b) =>
      b.longTermStability !== a.longTermStability
        ? b.longTermStability - a.longTermStability
        : b.timesActivated - a.timesActivated,
    )
    .slice(0, 8);
}

function buildOutcomeRow(branchName: string, agg: PerBranchOutcomeAggregate): BranchOutcomeRow {
  const count = Math.max(1, agg.count);
  const trustRecoveryRate = clamp10(
    (agg.successfulRecoveries / count) * 10,
  );
  // Fatigue recovery = how much fatigue dropped after activations.
  const fatigueRecoveryRate = clamp10(
    Math.max(0, -agg.fatigueDeltaSum / count) * 1.2,
  );
  const durabilityGain = clamp10(
    Math.max(0, agg.durabilityDeltaSum / count) * 1.2,
  );
  const averageDecayReduction = clamp10(
    Math.max(0, -agg.decayDeltaSum / count) * 1.2,
  );
  const longTermStability = clamp10(
    (agg.successfulRecoveries / count) * 6 +
    Math.max(0, agg.durabilityDeltaSum / count) * 0.6 +
    (1 - (agg.failures / count)) * 4,
  );
  return {
    branchName,
    timesActivated: agg.count,
    successfulRecoveries: agg.successfulRecoveries,
    trustRecoveryRate: round1(trustRecoveryRate),
    fatigueRecoveryRate: round1(fatigueRecoveryRate),
    durabilityGain: round1(durabilityGain),
    averageDecayReduction: round1(averageDecayReduction),
    longTermStability: round1(longTermStability),
  };
}

// ─── failed branch patterns ───────────────────────────────────

function buildFailedBranchPatterns(state: BranchActivationMemoryState): FailedBranchPattern[] {
  const out: FailedBranchPattern[] = [];
  for (const [branchName, agg] of Object.entries(state.perBranch)) {
    if (agg.failures === 0 || agg.count < 2) continue;
    const failureRate = agg.failures / agg.count;
    if (failureRate < 0.4) continue;
    const failurePattern = describeFailure(branchName, agg);
    const severity = clamp10(failureRate * 8 + Math.max(0, -agg.durabilityDeltaSum / agg.count) * 0.4);
    out.push({ branchName, failurePattern, severity: round1(severity) });
  }
  return out.sort((a, b) => b.severity - a.severity).slice(0, 4);
}

function describeFailure(branchName: string, agg: PerBranchOutcomeAggregate): string {
  const trustDeltaAvg = agg.trustDeltaSum / Math.max(1, agg.count);
  const fatigueDeltaAvg = agg.fatigueDeltaSum / Math.max(1, agg.count);
  const durabilityDeltaAvg = agg.durabilityDeltaSum / Math.max(1, agg.count);
  const reasons: string[] = [];
  if (trustDeltaAvg <= -1) reasons.push(`trust dropped ${trustDeltaAvg.toFixed(1)}/10`);
  if (fatigueDeltaAvg >= 1) reasons.push(`fatigue rose +${fatigueDeltaAvg.toFixed(1)}/10`);
  if (durabilityDeltaAvg <= -1) reasons.push(`durability dropped ${durabilityDeltaAvg.toFixed(1)}/10`);
  if (reasons.length === 0) reasons.push('mixed signals — branch did not produce expected lift');
  return `${branchName}: ${reasons.join(', ')}`;
}

// ─── durable branch patterns ──────────────────────────────────

function buildDurableBranchPatterns(state: BranchActivationMemoryState): DurableBranchPattern[] {
  const out: DurableBranchPattern[] = [];
  for (const [branchName, agg] of Object.entries(state.perBranch)) {
    if (agg.count < 2) continue;
    const recoveryRate = agg.successfulRecoveries / agg.count;
    if (recoveryRate < 0.6) continue;
    const durabilityScore = clamp10(
      recoveryRate * 6 + Math.max(0, agg.durabilityDeltaSum / agg.count) * 0.6,
    );
    const reasons: string[] = [];
    if (recoveryRate >= 0.8) reasons.push(`${(recoveryRate * 100).toFixed(0)}% recovery rate`);
    if (agg.trustDeltaSum / agg.count >= 1) reasons.push(`avg trust +${(agg.trustDeltaSum / agg.count).toFixed(1)}/10`);
    if (agg.durabilityDeltaSum / agg.count >= 1) reasons.push(`avg durability +${(agg.durabilityDeltaSum / agg.count).toFixed(1)}/10`);
    out.push({
      branchName,
      durabilityScore: round1(durabilityScore),
      reason: reasons.join(' · ') || 'consistent recovery without amplified pressure',
    });
  }
  return out.sort((a, b) => b.durabilityScore - a.durabilityScore).slice(0, 5);
}

// ─── operator patterns ────────────────────────────────────────

function buildOperatorPatterns(state: BranchActivationMemoryState): OperatorPattern[] {
  const out: OperatorPattern[] = [];
  for (const [operatorId, agg] of Object.entries(state.perOperator)) {
    if (agg.count < 1) continue;
    const preferred = Object.entries(agg.branchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([branch]) => branch);
    // Risk tolerance: average activation-time predicted risk (0..10).
    const riskTolerance = clamp10(agg.predictedRiskSum / Math.max(1, agg.count));
    // Trust bias: how often this operator picks trust-positive branches.
    const trustBias = clamp10(
      (agg.trustPositivePicks / Math.max(1, agg.count)) * 10,
    );
    // Novelty bias: how often this operator picks novelty-leaning branches.
    const noveltyBias = clamp10(
      (agg.noveltyLeaningPicks / Math.max(1, agg.count)) * 10,
    );
    out.push({
      operatorType: operatorId,
      preferredBranches: preferred,
      riskTolerance: round1(riskTolerance),
      trustBias: round1(trustBias),
      noveltyBias: round1(noveltyBias),
    });
  }
  return out
    .sort((a, b) => (state.perOperator[b.operatorType]?.count ?? 0) - (state.perOperator[a.operatorType]?.count ?? 0))
    .slice(0, 6);
}

// ─── projection accuracy ──────────────────────────────────────

function buildProjectionAccuracy(state: BranchActivationMemoryState): ProjectionAccuracyRow[] {
  return Object.entries(state.perProjectionType)
    .map(([type, agg]) => {
      const accuracy = agg.sampleSize > 0
        ? clamp10((agg.correctPredictions / agg.sampleSize) * 10)
        : 0;
      return {
        counterfactualType: type,
        historicalAccuracy: round1(accuracy),
        sampleSize: agg.sampleSize,
      };
    })
    .filter((r) => r.sampleSize >= 1)
    .sort((a, b) => b.historicalAccuracy - a.historicalAccuracy)
    .slice(0, 5);
}

// ─── activation timeline ──────────────────────────────────────

function buildActivationTimeline(state: BranchActivationMemoryState): ActivationTimelineRow[] {
  return state.activations.slice(-12).map((a) => ({
    phase: a.fromPhase,
    branch: a.branchName,
    result: a.resolutionResult,
    durabilityDelta: round1(a.measuredDurabilityDelta),
    trustDelta: round1(a.measuredTrustDelta),
    fatigueDelta: round1(a.measuredFatigueDelta),
  })).reverse();
}

// ─── recommended observations ─────────────────────────────────

function buildRecommendedObservations(
  state: BranchActivationMemoryState,
  branchOutcomes: BranchOutcomeRow[],
  failedBranchPatterns: FailedBranchPattern[],
  durableBranchPatterns: DurableBranchPattern[],
  projectionAccuracy: ProjectionAccuracyRow[],
): string[] {
  const obs: string[] = [];
  if (state.totalActivations === 0) {
    obs.push('no branch activations yet — operators have not chosen any suggested branches');
    return obs;
  }
  if (durableBranchPatterns.length > 0) {
    obs.push(`durable branches identified: ${durableBranchPatterns.slice(0, 2).map((d) => d.branchName).join(', ')} — observe whether they continue to compound`);
  }
  if (failedBranchPatterns.length > 0) {
    obs.push(`failed branch patterns recurring: ${failedBranchPatterns.slice(0, 2).map((f) => f.branchName).join(', ')} — observe before re-activating`);
  }
  // Branches with high simulation-vs-reality drift.
  const lowAccuracy = projectionAccuracy.filter((p) => p.historicalAccuracy <= 4 && p.sampleSize >= 2);
  if (lowAccuracy.length > 0) {
    obs.push(`projection accuracy weak for ${lowAccuracy.slice(0, 2).map((p) => p.counterfactualType).join(', ')} — simulation drifting from reality`);
  }
  // Branches with strong trust recovery.
  const strongTrust = branchOutcomes.filter((b) => b.trustRecoveryRate >= 7);
  if (strongTrust.length > 0) {
    obs.push(`trust recovery strongest in: ${strongTrust.slice(0, 2).map((b) => b.branchName).join(', ')}`);
  }
  return obs.slice(0, 5);
}

// ─── aggregate scalars ────────────────────────────────────────

function deriveActivationConfidence(state: BranchActivationMemoryState): number {
  // Confidence rises with: total activations + recovery rate.
  const total = state.totalActivations;
  if (total === 0) return 0;
  const resolvedCount = state.activations.filter((a) => a.resolved).length;
  if (resolvedCount === 0) return clamp10(2 + Math.min(total, 8) * 0.4);
  let successCount = 0;
  for (const a of state.activations) {
    if (a.resolved && a.resolutionResult === 'recovered') successCount += 1;
  }
  return clamp10((successCount / resolvedCount) * 7 + Math.min(total, 5) * 0.5);
}

function deriveHistoricalReliability(branchOutcomes: BranchOutcomeRow[]): number {
  if (branchOutcomes.length === 0) return 0;
  const avg = branchOutcomes.reduce((a, b) => a + b.longTermStability, 0) / branchOutcomes.length;
  return round1(clamp10(avg));
}

function deriveBranchTrustworthiness(branchOutcomes: BranchOutcomeRow[]): number {
  if (branchOutcomes.length === 0) return 0;
  const avg = branchOutcomes.reduce((a, b) => a + b.trustRecoveryRate, 0) / branchOutcomes.length;
  return round1(clamp10(avg));
}

function derivePredictionAccuracy(projectionAccuracy: ProjectionAccuracyRow[]): number {
  if (projectionAccuracy.length === 0) return 0;
  const total = projectionAccuracy.reduce((a, p) => a + p.sampleSize, 0);
  if (total === 0) return 0;
  const weighted = projectionAccuracy.reduce((a, p) => a + p.historicalAccuracy * p.sampleSize, 0);
  return round1(clamp10(weighted / total));
}

// ─── main ──────────────────────────────────────────────────────

export function computeBranchActivationLog(
  input: BranchActivationLogInput,
): BranchActivationLog {
  const mem = input.memory;
  if (!mem || mem.totalActivations === 0) {
    return {
      activationConfidence: 0,
      historicalReliability: 0,
      branchTrustworthiness: 0,
      predictionAccuracy: 0,
      operatorPatterns: [],
      branchOutcomes: [],
      failedBranchPatterns: [],
      durableBranchPatterns: [],
      projectionAccuracy: [],
      activationTimeline: [],
      recommendedObservations: [
        'no branch activations yet — operators have not chosen any suggested branches',
      ],
      reasonCodes: ['no-history'],
    };
  }

  const branchOutcomes = buildBranchOutcomes(mem);
  const failedBranchPatterns = buildFailedBranchPatterns(mem);
  const durableBranchPatterns = buildDurableBranchPatterns(mem);
  const operatorPatterns = buildOperatorPatterns(mem);
  const projectionAccuracy = buildProjectionAccuracy(mem);
  const activationTimeline = buildActivationTimeline(mem);
  const recommendedObservations = buildRecommendedObservations(
    mem, branchOutcomes, failedBranchPatterns, durableBranchPatterns, projectionAccuracy,
  );

  const activationConfidence = round1(deriveActivationConfidence(mem));
  const historicalReliability = deriveHistoricalReliability(branchOutcomes);
  const branchTrustworthiness = deriveBranchTrustworthiness(branchOutcomes);
  const predictionAccuracy = derivePredictionAccuracy(projectionAccuracy);

  return {
    activationConfidence,
    historicalReliability,
    branchTrustworthiness,
    predictionAccuracy,
    operatorPatterns,
    branchOutcomes,
    failedBranchPatterns,
    durableBranchPatterns,
    projectionAccuracy,
    activationTimeline,
    recommendedObservations,
    reasonCodes: [
      `total-activations:${mem.totalActivations}`,
      `resolved:${mem.activations.filter((a) => a.resolved).length}`,
      `branches-tracked:${branchOutcomes.length}`,
      `failed-branches:${failedBranchPatterns.length}`,
      `durable-branches:${durableBranchPatterns.length}`,
      `confidence:${activationConfidence}`,
      `reliability:${historicalReliability}`,
      `trustworthiness:${branchTrustworthiness}`,
      `prediction-accuracy:${predictionAccuracy}`,
    ],
  };
}

// Re-export the record for downstream consumers.
export type { BranchActivationRecord };
