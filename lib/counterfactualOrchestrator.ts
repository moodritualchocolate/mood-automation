/**
 * COUNTERFACTUAL ORCHESTRATOR (Wave 43)
 *
 * Per-event main update: runs all 8 strategy branches from the
 * post-event state, computes deltas, accumulates regret, detects
 * missed opportunities + false recoveries, ranks timelines,
 * classifies strategic state with hysteresis. Pure deterministic.
 */

import type {
  CounterfactualMemoryState, StrategyBranchResult, StrategyId,
  RegretRecord, RegretObservation,
} from './counterfactualMemory';
import type { SimulatedState } from './consequenceMemory';
import type { RegulationGradients } from './cognitiveGovernance';
import { runCounterfactualBranches } from './counterfactualEngine';
import {
  rankBranches, detectMissedOpportunities, detectFalseRecoveries,
  computeStrategyDeltas,
} from './timelineComparison';
import {
  updateRegretFromDelta, classifyStrategicState, transitionStrategicState,
} from './regretEngine';

export interface CounterfactualSignal {
  at: number;
  tick: number;
  start: SimulatedState;
  /** The post-event governance gradients used for the actual branch. */
  actualGradients: RegulationGradients;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function updateCounterfactualMemory(
  state: CounterfactualMemoryState, sig: CounterfactualSignal,
): CounterfactualMemoryState {
  // 1. Run all 8 branches.
  const branches = runCounterfactualBranches(sig.start, sig.actualGradients, sig.tick);

  // 2. Rank them.
  const ranking = rankBranches(branches, sig.at, sig.tick);
  const actualUnderperformanceCount = state.actualUnderperformanceCount + (ranking.actualWasTop ? 0 : 1);

  // 3. Detect missed opportunities + false recoveries.
  const missed = detectMissedOpportunities(branches, sig.at, sig.tick);
  const falses = detectFalseRecoveries(branches, sig.at, sig.tick);

  // 4. Compute per-strategy deltas vs actual.
  const deltas = computeStrategyDeltas(branches);

  // 5. Update regret records.
  const regrets = { ...state.regrets };
  const newObservations: RegretObservation[] = [];
  for (const delta of deltas) {
    regrets[delta.strategyId] = updateRegretFromDelta(regrets[delta.strategyId], delta, sig.at, sig.tick);
    // Log observations only when delta is meaningful.
    if (Math.abs(delta.survivabilityDelta) >= 0.1 || Math.abs(delta.continuityDelta) >= 0.1) {
      newObservations.push({
        at: sig.at, tick: sig.tick,
        alternateStrategy: delta.strategyId,
        survivabilityDelta: delta.survivabilityDelta,
        continuityDelta: delta.continuityDelta,
        efficiencyDelta: delta.efficiencyDelta,
      });
    }
  }
  // Also decay regret for strategies that didn't appear (shouldn't happen normally,
  // but defensive in case of strategy set changes).

  // 6. Strategic state classification.
  const totalComparisons = state.totalComparisons + 1;
  const underperformanceRate = totalComparisons > 0
    ? actualUnderperformanceCount / totalComparisons
    : 0;
  const candidate = classifyStrategicState(
    state.strategicState, regrets, totalComparisons, underperformanceRate,
  );
  const { state: strategicState, ticks: statePersistenceTicks, transitioned } =
    transitionStrategicState(state.strategicState, state.statePersistenceTicks, candidate);

  const transitions = transitioned
    ? [...state.transitions, {
        at: sig.at, tick: sig.tick,
        from: state.strategicState, to: strategicState,
        reason: `comparisons=${totalComparisons}, underperformance=${round2(underperformanceRate)}, dominant pressure ${Math.max(...Object.values(regrets).map((r) => r.accumulatedPressure)).toFixed(1)}`,
      }]
    : state.transitions;

  return {
    recentBranches: [...state.recentBranches, branches],
    regrets,
    regretObservations: [...state.regretObservations, ...newObservations],
    missedOpportunities: [...state.missedOpportunities, ...missed],
    falseRecoveries: [...state.falseRecoveries, ...falses],
    rankings: [...state.rankings, ranking],
    actualUnderperformanceCount,
    totalComparisons,
    strategicState,
    statePersistenceTicks,
    transitions,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? sig.at,
    updatedAt: sig.at,
  };
}
