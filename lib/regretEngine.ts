/**
 * REGRET ENGINE (Wave 43)
 *
 * Regret is NOT emotion. It is the persistent operational delta
 * between actual outcomes and superior alternative outcomes.
 *
 * Per cognitive event the engine updates one RegretRecord per
 * counterfactual strategy via EWMA-smoothed survivability /
 * continuity / efficiency advantage over actual. If a strategy
 * consistently outperforms (positive deltas + sustained samples),
 * its recurrenceConfidence rises + accumulatedPressure grows.
 * Strategies that stop outperforming see their pressure decay.
 *
 * The accumulated pressure feeds a CounterfactualBias struct
 * (±0.20 per gradient) that biases future governance toward the
 * dominant superior strategy's profile.
 *
 * Strategic-state classifier emits one of nine emergent states
 * with hysteresis-banded transitions.
 */

import type {
  CounterfactualMemoryState, RegretRecord, RegretObservation, StrategyId,
  CivilizationStrategicState, StrategicStateTransition,
} from './counterfactualMemory';
import type { StrategyDelta } from './timelineComparison';
import { STRATEGY_PROFILES } from './counterfactualEngine';

// ─── tuning constants ──────────────────────────────────────────

export const REGRET_EWMA_ALPHA = 0.15;
/** Delta below which we don't accumulate any pressure (noise floor). */
export const REGRET_DELTA_NOISE_FLOOR = 0.03;
/** Per-event accumulated-pressure decay (when strategy is not outperforming). */
export const REGRET_DECAY_PER_EVENT = 0.04;
export const REGRET_PRESSURE_CAP = 10;
export const CONFIDENCE_INCREMENT = 0.06;
export const CONFIDENCE_DECAY = 0.03;
export const STATE_HYSTERESIS_TICKS = 5;
export const COUNTERFACTUAL_BIAS_CLAMP = 0.20;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function clampBias(n: number): number { return clamp(-COUNTERFACTUAL_BIAS_CLAMP, COUNTERFACTUAL_BIAS_CLAMP, n); }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── per-strategy regret update ───────────────────────────────

export function updateRegretFromDelta(
  prev: RegretRecord, delta: StrategyDelta, at: number, tick: number,
): RegretRecord {
  // EWMA the three deltas.
  const survivabilityDelta = round2(
    prev.survivabilityDelta * (1 - REGRET_EWMA_ALPHA) + delta.survivabilityDelta * REGRET_EWMA_ALPHA,
  );
  const continuityDelta = round2(
    prev.continuityDelta * (1 - REGRET_EWMA_ALPHA) + delta.continuityDelta * REGRET_EWMA_ALPHA,
  );
  const efficiencyDelta = round2(
    prev.efficiencyDelta * (1 - REGRET_EWMA_ALPHA) + delta.efficiencyDelta * REGRET_EWMA_ALPHA,
  );

  // Composite advantage signal (filtered through noise floor).
  const composite = survivabilityDelta * 0.5 + continuityDelta * 0.3 + efficiencyDelta * 0.2;
  const advantaging = composite > REGRET_DELTA_NOISE_FLOOR;

  // Recurrence confidence: rises when strategy outperforms, decays otherwise.
  const recurrenceConfidence = clamp01(round2(
    advantaging
      ? prev.recurrenceConfidence + CONFIDENCE_INCREMENT
      : prev.recurrenceConfidence - CONFIDENCE_DECAY,
  ));

  // Accumulated pressure: grows when advantaging × confidence, decays otherwise.
  const pressureDelta = advantaging
    ? composite * recurrenceConfidence * 0.5
    : -REGRET_DECAY_PER_EVENT;
  const accumulatedPressure = clamp(0, REGRET_PRESSURE_CAP, round2(prev.accumulatedPressure + pressureDelta));

  return {
    strategyId: prev.strategyId,
    survivabilityDelta, continuityDelta, efficiencyDelta,
    recurrenceConfidence, accumulatedPressure,
    observationCount: prev.observationCount + 1,
    lastObservedTick: tick,
  };
}

// ─── strategic-state classification ────────────────────────────

export function classifyStrategicState(
  prev: CivilizationStrategicState,
  regrets: Record<StrategyId, RegretRecord>,
  totalComparisons: number,
  actualUnderperformanceRate: number,
): CivilizationStrategicState {
  if (totalComparisons < 5) return 'reactive';

  // Find dominant regret strategy (highest pressure).
  let dominantPressure = 0;
  let dominantStrategy: StrategyId | null = null;
  for (const r of Object.values(regrets)) {
    if (r.accumulatedPressure > dominantPressure) {
      dominantPressure = r.accumulatedPressure;
      dominantStrategy = r.strategyId;
    }
  }

  // Sum total pressure across strategies.
  const totalPressure = Object.values(regrets).reduce((a, r) => a + r.accumulatedPressure, 0);

  // High dominant pressure → strategically-dissatisfied.
  if (dominantPressure >= 5) return 'strategically-dissatisfied';
  // Total pressure high → regret-conditioned.
  if (totalPressure >= 8) return 'regret-conditioned';
  // High underperformance rate → trajectory-sensitive.
  if (actualUnderperformanceRate >= 0.5) return 'trajectory-sensitive';
  // Specific strategy dominance shifts state.
  if (dominantStrategy === 'continuity-first' && dominantPressure >= 3) return 'continuity-optimized';
  if (dominantStrategy === 'mutation-first' && dominantPressure >= 3) return 'evolution-seeking';
  if ((dominantStrategy === 'recovery-heavy' || dominantStrategy === 'governance-restrictive')
    && dominantPressure >= 3) return 'over-conservative';
  if (totalComparisons >= 20) return 'historically-aware';
  return 'adaptive';
}

export function transitionStrategicState(
  prev: CivilizationStrategicState, prevTicks: number,
  candidate: CivilizationStrategicState,
): { state: CivilizationStrategicState; ticks: number; transitioned: boolean } {
  if (candidate === prev) return { state: prev, ticks: prevTicks + 1, transitioned: false };
  if (prevTicks < STATE_HYSTERESIS_TICKS) {
    return { state: prev, ticks: prevTicks + 1, transitioned: false };
  }
  return { state: candidate, ticks: 1, transitioned: true };
}

// ─── counterfactual bias ──────────────────────────────────────

export interface CounterfactualBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

/** Translate per-strategy regret pressure into gradient bias deltas.
 *  Each strategy contributes a small pull TOWARD its profile direction
 *  weighted by its pressure. Bounded ±0.20 per gradient. */
export function computeCounterfactualBias(
  regrets: Record<StrategyId, RegretRecord>,
): CounterfactualBias {
  // Aggregate pressure-weighted profile contributions, normalized.
  const totalPressure = Object.values(regrets)
    .filter((r) => r.strategyId !== 'actual')
    .reduce((a, r) => a + r.accumulatedPressure, 0);
  if (totalPressure < 0.1) {
    return {
      cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
      deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
    };
  }
  let throughput = 0, escalation = 0, exploration = 0;
  let defer = 0, recovery = 0, burst = 0;
  for (const r of Object.values(regrets)) {
    if (r.strategyId === 'actual') continue;
    if (r.accumulatedPressure < 0.5) continue;
    const profile = STRATEGY_PROFILES[r.strategyId as Exclude<StrategyId, 'actual'>];
    // Each strategy's contribution = (its profile - 0.5 neutral) × pressure-weight × scale
    const weight = (r.accumulatedPressure / REGRET_PRESSURE_CAP) * 0.4;
    throughput  += (profile.cognitionThroughput  - 0.5) * weight;
    escalation  += (profile.escalationPermission - 0.5) * weight;
    exploration += (profile.explorationIntensity - 0.5) * weight;
    defer       += (profile.deferAcceptance      - 0.5) * weight;
    recovery    += (profile.recoveryWeighting    - 0.5) * weight;
    burst       += (profile.burstTolerance       - 0.5) * weight;
  }
  return {
    cognitionThroughput:  clampBias(round2(throughput)),
    escalationPermission: clampBias(round2(escalation)),
    explorationIntensity: clampBias(round2(exploration)),
    deferAcceptance:      clampBias(round2(defer)),
    recoveryWeighting:    clampBias(round2(recovery)),
    burstTolerance:       clampBias(round2(burst)),
  };
}

export function applyCounterfactualBias<G extends CounterfactualBias>(
  gradients: G, bias: CounterfactualBias,
): G {
  return {
    ...gradients,
    cognitionThroughput:  clamp01(round2(gradients.cognitionThroughput  + bias.cognitionThroughput)),
    escalationPermission: clamp01(round2(gradients.escalationPermission + bias.escalationPermission)),
    explorationIntensity: clamp01(round2(gradients.explorationIntensity + bias.explorationIntensity)),
    deferAcceptance:      clamp01(round2(gradients.deferAcceptance      + bias.deferAcceptance)),
    recoveryWeighting:    clamp01(round2(gradients.recoveryWeighting    + bias.recoveryWeighting)),
    burstTolerance:       clamp01(round2(gradients.burstTolerance       + bias.burstTolerance)),
  };
}

/** Simulation pressure contribution — rises when regret pressure
 *  is sustained, signaling actual trajectory is consistently
 *  suboptimal. 0..0.2. */
export function counterfactualPressureContribution(
  state: CounterfactualMemoryState,
): number {
  const maxPressure = Object.values(state.regrets)
    .filter((r) => r.strategyId !== 'actual')
    .reduce((m, r) => Math.max(m, r.accumulatedPressure), 0);
  if (maxPressure < 3) return 0;
  return round2(Math.min(0.2, (maxPressure - 3) * 0.03));
}
