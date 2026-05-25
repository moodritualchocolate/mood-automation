/**
 * COUNTERFACTUAL ENGINE (Wave 43)
 *
 * Pure deterministic alternate-trajectory generation. Each cognitive
 * event the engine runs the SAME projection step model as Wave 36's
 * strategic simulator, but with seven different gradient profiles
 * representing canonical operational strategies. The actual branch
 * uses the live post-event gradients; the seven counterfactuals
 * each use a fixed strategy profile. All start from the SAME
 * post-event SimulatedState.
 *
 * No RNG. Same starting state + same profiles → same projections.
 */

import type {
  RegulationGradients,
} from './cognitiveGovernance';
import type {
  SimulatedState,
} from './consequenceMemory';
import {
  projectHorizon, HORIZON_SHORT, HORIZON_MEDIUM, HORIZON_LONG,
} from './strategicSimulation';
import type {
  StrategyId, StrategyBranchResult, StrategyHorizonProjection,
} from './counterfactualMemory';

// ─── strategy profiles ─────────────────────────────────────────
//
// Seven canonical gradient profiles representing distinct operational
// stances. The eighth strategy ('actual') uses the live gradients.

export const STRATEGY_PROFILES: Record<Exclude<StrategyId, 'actual'>, RegulationGradients> = {
  'conservative': {
    cognitionThroughput: 0.45, escalationPermission: 0.35,
    explorationIntensity: 0.30, deferAcceptance: 0.85,
    recoveryWeighting: 0.85, burstTolerance: 0.25,
  },
  'aggressive': {
    cognitionThroughput: 1.00, escalationPermission: 0.95,
    explorationIntensity: 0.95, deferAcceptance: 0.15,
    recoveryWeighting: 0.15, burstTolerance: 1.00,
  },
  'recovery-heavy': {
    cognitionThroughput: 0.30, escalationPermission: 0.40,
    explorationIntensity: 0.35, deferAcceptance: 1.00,
    recoveryWeighting: 1.00, burstTolerance: 0.20,
  },
  'continuity-first': {
    cognitionThroughput: 0.50, escalationPermission: 0.40,
    explorationIntensity: 0.30, deferAcceptance: 0.70,
    recoveryWeighting: 0.70, burstTolerance: 0.40,
  },
  'mutation-first': {
    cognitionThroughput: 0.70, escalationPermission: 0.65,
    explorationIntensity: 1.00, deferAcceptance: 0.35,
    recoveryWeighting: 0.45, burstTolerance: 0.85,
  },
  'governance-restrictive': {
    cognitionThroughput: 0.20, escalationPermission: 0.20,
    explorationIntensity: 0.20, deferAcceptance: 1.00,
    recoveryWeighting: 1.00, burstTolerance: 0.10,
  },
  'exploration-heavy': {
    cognitionThroughput: 0.85, escalationPermission: 0.70,
    explorationIntensity: 1.00, deferAcceptance: 0.30,
    recoveryWeighting: 0.45, burstTolerance: 0.95,
  },
};

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── composite scoring ────────────────────────────────────────

/** Composite ranking score 0..10 for a branch — combines short / medium /
 *  long survivabilities with critical-region penalty + end-state
 *  reliability + budget intact + low contradiction. */
export function compositeScoreForBranch(
  short: StrategyHorizonProjection,
  medium: StrategyHorizonProjection,
  long: StrategyHorizonProjection,
): number {
  const survAvg = (short.survivability + medium.survivability * 1.2 + long.survivability * 1.5) / 3.7;
  const criticalPenalty =
    (short.enteredCritical ? 0.3 : 0)
    + (medium.enteredCritical ? 0.4 : 0)
    + (long.enteredCritical ? 0.5 : 0);
  const endHealth =
    (long.endState.reliability / 10) * 0.3
    + (long.endState.budget / 50) * 0.25
    + ((10 - long.endState.maxTension) / 10) * 0.25
    + (long.endState.coherence / 10) * 0.2;
  // Scale: survAvg (0..1) + endHealth (0..1) - criticalPenalty (0..1.2)
  const raw = survAvg * 5 + endHealth * 5 - criticalPenalty * 2;
  return round2(clamp10(raw));
}

// ─── branch projection ────────────────────────────────────────

export function projectStrategyBranch(
  strategyId: StrategyId,
  start: SimulatedState,
  gradients: RegulationGradients,
  parentTick: number,
): StrategyBranchResult {
  const short = projectHorizon(start, gradients, HORIZON_SHORT);
  const medium = projectHorizon(start, gradients, HORIZON_MEDIUM);
  const long = projectHorizon(start, gradients, HORIZON_LONG);

  const shortP: StrategyHorizonProjection = {
    horizon: HORIZON_SHORT,
    endState: short.endState,
    survivability: short.survivability,
    enteredCritical: short.enteredCritical,
  };
  const mediumP: StrategyHorizonProjection = {
    horizon: HORIZON_MEDIUM,
    endState: medium.endState,
    survivability: medium.survivability,
    enteredCritical: medium.enteredCritical,
  };
  const longP: StrategyHorizonProjection = {
    horizon: HORIZON_LONG,
    endState: long.endState,
    survivability: long.survivability,
    enteredCritical: long.enteredCritical,
  };

  const compositeScore = compositeScoreForBranch(shortP, mediumP, longP);

  return {
    strategyId,
    parentTick,
    startState: start,
    horizons: { short: shortP, medium: mediumP, long: longP },
    compositeScore,
  };
}

// ─── full branch set ──────────────────────────────────────────

/** Run actual + all seven counterfactual branches from the same
 *  starting state. Returns array of eight StrategyBranchResults. */
export function runCounterfactualBranches(
  start: SimulatedState,
  actualGradients: RegulationGradients,
  parentTick: number,
): StrategyBranchResult[] {
  const results: StrategyBranchResult[] = [];
  results.push(projectStrategyBranch('actual', start, actualGradients, parentTick));
  for (const [strategyId, profile] of Object.entries(STRATEGY_PROFILES) as [Exclude<StrategyId, 'actual'>, RegulationGradients][]) {
    results.push(projectStrategyBranch(strategyId, start, profile, parentTick));
  }
  return results;
}
