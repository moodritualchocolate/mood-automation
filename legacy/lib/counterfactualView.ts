/**
 * COUNTERFACTUAL VIEW (Wave 43)
 *
 * Dashboard view model for the alternate-civilization analysis.
 * Surfaces last branch set with composite scores + survivabilities,
 * per-strategy regret records, missed opportunities, false recoveries,
 * civilization strategic state, and CounterfactualBias on governance.
 *
 * Scientific. Cold. Simulation-grade. NO sci-fi aesthetics.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  CounterfactualMemoryState, StrategyBranchResult, StrategyId,
  RegretRecord, MissedOpportunity, FalseRecovery, TimelineRanking,
  CivilizationStrategicState, StrategicStateTransition,
} from './counterfactualMemory';
import {
  computeCounterfactualBias, counterfactualPressureContribution,
  type CounterfactualBias,
} from './regretEngine';

export interface BranchRow {
  strategyId: StrategyId;
  compositeScore: number;
  shortSurvivability: number;
  mediumSurvivability: number;
  longSurvivability: number;
  shortCritical: boolean;
  mediumCritical: boolean;
  longCritical: boolean;
  endReliability: number;
  endBudget: number;
  endTension: number;
  rank: number;
}

export interface RegretRow {
  strategyId: StrategyId;
  survivabilityDelta: number;
  continuityDelta: number;
  efficiencyDelta: number;
  recurrenceConfidence: number;
  accumulatedPressure: number;
  observationCount: number;
}

export interface CounterfactualViewModel {
  present: boolean;
  strategicState: CivilizationStrategicState;
  status: 'reactive' | 'observing' | 'dissatisfied' | 'optimizing';
  statePersistenceTicks: number;
  totalComparisons: number;
  actualUnderperformanceRate: number;
  lastTopStrategy: StrategyId | null;
  lastBranches: BranchRow[];
  regrets: RegretRow[];
  missedOpportunities: MissedOpportunity[];
  falseRecoveries: FalseRecovery[];
  bias: CounterfactualBias;
  simulationPressureContribution: number;
  recentTransitions: StrategicStateTransition[];
  statement: string;
}

const ZERO_BIAS: CounterfactualBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

function round2(n: number): number { return Math.round(n * 100) / 100; }

function branchToRow(b: StrategyBranchResult, rank: number): BranchRow {
  return {
    strategyId: b.strategyId,
    compositeScore: b.compositeScore,
    shortSurvivability: b.horizons.short.survivability,
    mediumSurvivability: b.horizons.medium.survivability,
    longSurvivability: b.horizons.long.survivability,
    shortCritical: b.horizons.short.enteredCritical,
    mediumCritical: b.horizons.medium.enteredCritical,
    longCritical: b.horizons.long.enteredCritical,
    endReliability: b.horizons.long.endState.reliability,
    endBudget: b.horizons.long.endState.budget,
    endTension: b.horizons.long.endState.maxTension,
    rank,
  };
}

function regretToRow(r: RegretRecord): RegretRow {
  return {
    strategyId: r.strategyId,
    survivabilityDelta: r.survivabilityDelta,
    continuityDelta: r.continuityDelta,
    efficiencyDelta: r.efficiencyDelta,
    recurrenceConfidence: r.recurrenceConfidence,
    accumulatedPressure: r.accumulatedPressure,
    observationCount: r.observationCount,
  };
}

export function buildCounterfactualView(snap: RuntimeSnapshot): CounterfactualViewModel {
  const cf = snap.counterfactualMemory ?? null;
  if (!cf) {
    return {
      present: false,
      strategicState: 'reactive',
      status: 'reactive',
      statePersistenceTicks: 0,
      totalComparisons: 0,
      actualUnderperformanceRate: 0,
      lastTopStrategy: null,
      lastBranches: [],
      regrets: [],
      missedOpportunities: [],
      falseRecoveries: [],
      bias: ZERO_BIAS,
      simulationPressureContribution: 0,
      recentTransitions: [],
      statement: 'counterfactual memory has not observed a cognitive event yet — no alternate trajectories computed',
    };
  }

  const lastBranchSet = cf.recentBranches[cf.recentBranches.length - 1] ?? [];
  const sortedBranches = [...lastBranchSet].sort((a, b) => b.compositeScore - a.compositeScore);
  const lastBranches: BranchRow[] = sortedBranches.map((b, i) => branchToRow(b, i + 1));
  const lastTopStrategy = sortedBranches[0]?.strategyId ?? null;

  const regretsArr = Object.values(cf.regrets)
    .filter((r) => r.strategyId !== 'actual' && r.observationCount > 0)
    .map(regretToRow)
    .sort((a, b) => b.accumulatedPressure - a.accumulatedPressure);

  const missedOpportunities = cf.missedOpportunities.slice(-6).reverse();
  const falseRecoveries = cf.falseRecoveries.slice(-6).reverse();
  const bias = computeCounterfactualBias(cf.regrets);
  const simulationPressureContribution = counterfactualPressureContribution(cf);

  const actualUnderperformanceRate = cf.totalComparisons > 0
    ? round2(cf.actualUnderperformanceCount / cf.totalComparisons)
    : 0;

  const status: CounterfactualViewModel['status'] =
    cf.strategicState === 'reactive' ? 'reactive' :
    cf.strategicState === 'strategically-dissatisfied' || cf.strategicState === 'regret-conditioned' ? 'dissatisfied' :
    cf.strategicState === 'continuity-optimized' || cf.strategicState === 'evolution-seeking' || cf.strategicState === 'over-conservative' ? 'optimizing' :
    'observing';

  const statement = (() => {
    const totalPressure = round2(
      regretsArr.reduce((a, r) => a + r.accumulatedPressure, 0),
    );
    if (cf.strategicState === 'strategically-dissatisfied') {
      const top = regretsArr[0];
      return top
        ? `strategically DISSATISFIED — '${top.strategyId}' regret pressure ${top.accumulatedPressure.toFixed(1)}/10, actual underperforming ${(actualUnderperformanceRate * 100).toFixed(0)}% of events`
        : `strategically dissatisfied — distributed regret pressure ${totalPressure}`;
    }
    if (cf.strategicState === 'continuity-optimized') {
      return `continuity-optimized — counterfactual bias pulling toward continuity-first profile (pressure ${cf.regrets['continuity-first'].accumulatedPressure.toFixed(1)})`;
    }
    if (cf.strategicState === 'evolution-seeking') {
      return `evolution-seeking — counterfactual bias pulling toward mutation-first profile (pressure ${cf.regrets['mutation-first'].accumulatedPressure.toFixed(1)})`;
    }
    if (cf.strategicState === 'over-conservative') {
      return `over-conservative — recovery/restrictive strategies dominate regret (total pressure ${totalPressure}); may be over-throttling`;
    }
    if (cf.strategicState === 'trajectory-sensitive') {
      return `trajectory-sensitive — actual was top in only ${(100 - actualUnderperformanceRate * 100).toFixed(0)}% of comparisons`;
    }
    if (cf.strategicState === 'reactive') {
      return `reactive — counterfactual data accumulating (${cf.totalComparisons} comparisons recorded)`;
    }
    return `${cf.strategicState} — top strategy this event '${lastTopStrategy}', actual underperformance ${(actualUnderperformanceRate * 100).toFixed(0)}%`;
  })();

  return {
    present: true,
    strategicState: cf.strategicState,
    status,
    statePersistenceTicks: cf.statePersistenceTicks,
    totalComparisons: cf.totalComparisons,
    actualUnderperformanceRate,
    lastTopStrategy,
    lastBranches,
    regrets: regretsArr,
    missedOpportunities,
    falseRecoveries,
    bias,
    simulationPressureContribution,
    recentTransitions: cf.transitions.slice(-6).reverse(),
    statement,
  };
}
