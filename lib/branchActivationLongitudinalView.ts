/**
 * BRANCH ACTIVATION LONGITUDINAL VIEW
 *
 * Read-only analyzer over branch-activation memory + a current
 * activation-log snapshot. Surfaces:
 *
 *   - most trusted branches
 *   - highest durability branches
 *   - failed branch patterns
 *   - operator preference evolution
 *   - prediction accuracy trend
 *   - trust recovery ranking
 *   - fatigue recovery ranking
 *   - decay reduction ranking
 *   - branch reliability trajectory
 *   - simulation-vs-reality correlation
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  BranchActivationMemoryState, BranchActivationRecord,
} from './branchActivationMemory';
import type { BranchActivationLog } from './branchActivationLog';

// ─── shape ─────────────────────────────────────────────────────

export interface RankingRow {
  branchName: string;
  score: number;
  count: number;
}

export interface OperatorEvolutionRow {
  operatorId: string;
  totalActivations: number;
  topBranch: string | null;
  trustBias: number;
  noveltyBias: number;
  recentTrustBias: number;
  noveltyBiasDrift: number;     // recent - historical
}

export interface RecentResolutionRow {
  id: string;
  branchName: string;
  fromPhase: string;
  result: string;
  trustDelta: number;
  fatigueDelta: number;
  durabilityDelta: number;
}

export interface SimulationVsRealityRow {
  counterfactualType: string;
  predictedAvgTrust: number;
  measuredAvgTrust: number;
  predictedAvgDurability: number;
  measuredAvgDurability: number;
  accuracyScore: number;
}

export type BranchActivationTrend =
  | 'no-history' | 'establishing' | 'reliability-rising'
  | 'reliability-stable' | 'reliability-falling';

export interface BranchActivationLongitudinalView {
  present: boolean;
  statement: string;
  trend: BranchActivationTrend;

  totalActivations: number;
  resolvedActivations: number;
  pendingActivations: number;

  current: BranchActivationLog | null;

  mostTrustedBranches: RankingRow[];
  highestDurabilityBranches: RankingRow[];
  trustRecoveryRanking: RankingRow[];
  fatigueRecoveryRanking: RankingRow[];
  decayReductionRanking: RankingRow[];

  operatorEvolution: OperatorEvolutionRow[];
  simulationVsReality: SimulationVsRealityRow[];

  recentResolutions: RecentResolutionRow[];
  branchReliabilityTrajectory: { at: number; reliability: number }[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function clamp(min: number, max: number, n: number): number { return Math.max(min, Math.min(max, n)); }
function clamp10(n: number): number { return clamp(0, 10, n); }

// ─── trend classifier ────────────────────────────────────────

function classifyTrend(state: BranchActivationMemoryState): BranchActivationTrend {
  if (state.totalActivations === 0) return 'no-history';
  const resolved = state.activations.filter((a) => a.resolved);
  if (resolved.length < 3) return 'establishing';
  const half = Math.floor(resolved.length / 2);
  const early = resolved.slice(0, half);
  const recent = resolved.slice(half);
  const earlyRate = early.filter((a) => a.resolutionResult === 'recovered').length / Math.max(1, early.length);
  const recentRate = recent.filter((a) => a.resolutionResult === 'recovered').length / Math.max(1, recent.length);
  const delta = recentRate - earlyRate;
  if (delta > 0.15) return 'reliability-rising';
  if (delta < -0.15) return 'reliability-falling';
  return 'reliability-stable';
}

// ─── ranking builders ─────────────────────────────────────────

function mostTrustedBranches(log: BranchActivationLog): RankingRow[] {
  return log.branchOutcomes
    .filter((b) => b.timesActivated >= 1)
    .map((b) => ({
      branchName: b.branchName,
      score: b.trustRecoveryRate,
      count: b.timesActivated,
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 5);
}

function highestDurabilityBranches(log: BranchActivationLog): RankingRow[] {
  return log.branchOutcomes
    .filter((b) => b.timesActivated >= 1)
    .map((b) => ({
      branchName: b.branchName,
      score: b.durabilityGain,
      count: b.timesActivated,
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 5);
}

function trustRecoveryRanking(log: BranchActivationLog): RankingRow[] {
  return log.branchOutcomes
    .filter((b) => b.timesActivated >= 1)
    .map((b) => ({
      branchName: b.branchName,
      score: b.trustRecoveryRate,
      count: b.timesActivated,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function fatigueRecoveryRanking(log: BranchActivationLog): RankingRow[] {
  return log.branchOutcomes
    .filter((b) => b.timesActivated >= 1)
    .map((b) => ({
      branchName: b.branchName,
      score: b.fatigueRecoveryRate,
      count: b.timesActivated,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function decayReductionRanking(log: BranchActivationLog): RankingRow[] {
  return log.branchOutcomes
    .filter((b) => b.timesActivated >= 1)
    .map((b) => ({
      branchName: b.branchName,
      score: b.averageDecayReduction,
      count: b.timesActivated,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ─── operator evolution ───────────────────────────────────────

function operatorEvolution(state: BranchActivationMemoryState): OperatorEvolutionRow[] {
  const out: OperatorEvolutionRow[] = [];
  const operators = Object.keys(state.perOperator);
  for (const operatorId of operators) {
    const allForOp = state.activations.filter((a) => a.operatorId === operatorId);
    if (allForOp.length === 0) continue;
    const agg = state.perOperator[operatorId];
    const topBranch = Object.entries(agg.branchCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const trustBias = clamp10((agg.trustPositivePicks / Math.max(1, agg.count)) * 10);
    const noveltyBias = clamp10((agg.noveltyLeaningPicks / Math.max(1, agg.count)) * 10);
    // Recent: last 6 activations for this operator.
    const recent = allForOp.slice(-6);
    const recentTrust = recent.filter((a) => a.predictedTrustImpact > 0).length;
    const recentNovelty = recent.filter((a) =>
      a.branchName === 'novelty-surge' ||
      a.branchName === 'viral-instability' ||
      a.branchName === 'high-curiosity-hook-heavy',
    ).length;
    const recentTrustBias = clamp10((recentTrust / Math.max(1, recent.length)) * 10);
    const recentNoveltyBias = clamp10((recentNovelty / Math.max(1, recent.length)) * 10);
    out.push({
      operatorId,
      totalActivations: agg.count,
      topBranch,
      trustBias: round1(trustBias),
      noveltyBias: round1(noveltyBias),
      recentTrustBias: round1(recentTrustBias),
      noveltyBiasDrift: round1(recentNoveltyBias - noveltyBias),
    });
  }
  return out.sort((a, b) => b.totalActivations - a.totalActivations).slice(0, 6);
}

// ─── simulation vs reality ────────────────────────────────────

function simulationVsReality(state: BranchActivationMemoryState): SimulationVsRealityRow[] {
  // Per counterfactual type, average predicted vs measured impacts.
  const types = new Set(state.activations.map((a) => a.counterfactualType));
  const out: SimulationVsRealityRow[] = [];
  for (const type of types) {
    const resolvedOfType = state.activations.filter(
      (a) => a.counterfactualType === type && a.resolved,
    );
    if (resolvedOfType.length === 0) continue;
    const n = resolvedOfType.length;
    const avg = (key: keyof BranchActivationRecord) => {
      const sum = resolvedOfType.reduce((a, r) => a + ((r[key] as number) ?? 0), 0);
      return round1(sum / n);
    };
    const predictedAvgTrust = avg('predictedTrustImpact');
    const predictedAvgDurability = avg('predictedDurabilityImpact');
    const measuredAvgTrust = round1(
      resolvedOfType.reduce((a, r) =>
        a + (r.observationsAfter > 0 ? r.measuredTrustDelta / r.observationsAfter : 0), 0) / n,
    );
    const measuredAvgDurability = round1(
      resolvedOfType.reduce((a, r) =>
        a + (r.observationsAfter > 0 ? r.measuredDurabilityDelta / r.observationsAfter : 0), 0) / n,
    );
    // Accuracy: 10 - average absolute error across the two axes.
    const trustErr = Math.abs(predictedAvgTrust - measuredAvgTrust);
    const durErr = Math.abs(predictedAvgDurability - measuredAvgDurability);
    const accuracyScore = clamp10(10 - (trustErr + durErr) * 1.0);
    out.push({
      counterfactualType: type,
      predictedAvgTrust,
      measuredAvgTrust,
      predictedAvgDurability,
      measuredAvgDurability,
      accuracyScore: round1(accuracyScore),
    });
  }
  return out.sort((a, b) => b.accuracyScore - a.accuracyScore).slice(0, 5);
}

// ─── recent resolutions ───────────────────────────────────────

function recentResolutions(state: BranchActivationMemoryState): RecentResolutionRow[] {
  return state.activations
    .filter((a) => a.resolved)
    .slice(-8)
    .reverse()
    .map((a) => ({
      id: a.id,
      branchName: a.branchName,
      fromPhase: a.fromPhase,
      result: a.resolutionResult,
      trustDelta: round1(a.observationsAfter > 0 ? a.measuredTrustDelta / a.observationsAfter : 0),
      fatigueDelta: round1(a.observationsAfter > 0 ? a.measuredFatigueDelta / a.observationsAfter : 0),
      durabilityDelta: round1(a.observationsAfter > 0 ? a.measuredDurabilityDelta / a.observationsAfter : 0),
    }));
}

// ─── branch reliability trajectory ────────────────────────────

function branchReliabilityTrajectory(state: BranchActivationMemoryState): { at: number; reliability: number }[] {
  // Walk resolved activations in order; emit running success rate (0..10).
  const resolved = state.activations.filter((a) => a.resolved);
  let wins = 0;
  return resolved.map((a, i) => {
    if (a.resolutionResult === 'recovered') wins += 1;
    return { at: a.activatedAt, reliability: round1(clamp10((wins / (i + 1)) * 10)) };
  }).slice(-24);
}

// ─── main builder ──────────────────────────────────────────────

export interface BranchActivationViewInput {
  memory: BranchActivationMemoryState | null;
  current?: BranchActivationLog | null;
}

export function buildBranchActivationLongitudinalView(
  input: BranchActivationViewInput,
): BranchActivationLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalActivations === 0) {
    return {
      present: false,
      statement: 'no branch activations yet — strategic reinforcement memory is empty',
      trend: 'no-history',
      totalActivations: 0,
      resolvedActivations: 0,
      pendingActivations: 0,
      current: input.current ?? null,
      mostTrustedBranches: [],
      highestDurabilityBranches: [],
      trustRecoveryRanking: [],
      fatigueRecoveryRanking: [],
      decayReductionRanking: [],
      operatorEvolution: [],
      simulationVsReality: [],
      recentResolutions: [],
      branchReliabilityTrajectory: [],
    };
  }

  const total = mem.totalActivations;
  const trend = classifyTrend(mem);
  const resolved = mem.activations.filter((a) => a.resolved).length;
  const pending = mem.activations.length - resolved;

  const log = input.current;
  const mostTrusted     = log ? mostTrustedBranches(log)     : [];
  const highestDurable  = log ? highestDurabilityBranches(log): [];
  const trustRanking    = log ? trustRecoveryRanking(log)    : [];
  const fatigueRanking  = log ? fatigueRecoveryRanking(log)  : [];
  const decayRanking    = log ? decayReductionRanking(log)   : [];
  const opEvolution     = operatorEvolution(mem);
  const simVsReal       = simulationVsReality(mem);
  const recentRes       = recentResolutions(mem);
  const trajectory      = branchReliabilityTrajectory(mem);

  const statement = (() => {
    switch (trend) {
      case 'reliability-rising':
        return `branch reliability rising — recent activations recovering more often (${total} total)`;
      case 'reliability-falling':
        return `branch reliability falling — recent activations failing more often (${total} total)`;
      case 'reliability-stable':
        return `branch reliability stable — recovery rate steady across ${total} activations`;
      default:
        return `establishing branch activation baseline — ${total} activation(s) recorded`;
    }
  })();

  return {
    present: true,
    statement,
    trend,
    totalActivations: total,
    resolvedActivations: resolved,
    pendingActivations: pending,
    current: log ?? null,
    mostTrustedBranches: mostTrusted,
    highestDurabilityBranches: highestDurable,
    trustRecoveryRanking: trustRanking,
    fatigueRecoveryRanking: fatigueRanking,
    decayReductionRanking: decayRanking,
    operatorEvolution: opEvolution,
    simulationVsReality: simVsReal,
    recentResolutions: recentRes,
    branchReliabilityTrajectory: trajectory,
  };
}
