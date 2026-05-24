/**
 * GOVERNANCE ENGINE (Wave 35)
 *
 * Pure deterministic regulation. Reads meta-cognitive reliability +
 * contradiction pressure + fragmentation trajectory + recovery
 * trends, produces:
 *
 *   - the next TrustZone (with hysteresis-banded transitions)
 *   - the next CognitiveBudget (verb-cost driven)
 *   - the next InstabilityForecast (linear projection N events forward)
 *   - the next RegulationGradients (zone + budget + forecast composed)
 *   - one optional DecisionRecord per event (zone change, budget warning,
 *     forecast warning, significant gradient shift)
 *
 * No narratives. No fabricated intentions. Threshold-based zoning,
 * fixed verb costs, linear forecast — every output is a measurement
 * of real state.
 *
 * The engine also exposes pure helpers (governEscalationThreshold,
 * governDeferThresholds, governRestThresholds) that other engines
 * call when they need a governance-biased version of an already-
 * adaptive Wave 34 threshold. Soft throttling: the bias never blocks
 * a verb — it only shifts the threshold the verb is evaluated against.
 */

import type {
  CognitiveGovernanceState,
  CognitiveBudget,
  RegulationGradients,
  InstabilityForecast,
  DecisionRecord,
  TrustZone,
  ReliabilitySample,
} from './cognitiveGovernance';
import { BUDGET_MAX, NEUTRAL_GRADIENTS, RELIABILITY_SAMPLES_LIMIT } from './cognitiveGovernance';
import type { MetaCognitiveState } from './metaCognitive';
import type { ContradictionMemoryState } from './contradictionMemory';
import type { TemporalMemoryState } from './temporalMemory';
import type { AdaptiveDeferThresholds, AdaptiveRestThresholds } from './adaptiveRegulation';

// ─── helpers ───────────────────────────────────────────────────

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

/** Significant-shift threshold for any single gradient between two
 *  ticks. Used to count significantShifts and (when large) to log
 *  a DecisionRecord. */
export const GRADIENT_SHIFT_THRESHOLD = 0.1;

/** Forecast horizon in cognitive events (≈ ticks). */
export const FORECAST_HORIZON_EVENTS = 5;

/** Budget threshold below which recovery gradient is forced up. */
export const BUDGET_LOW_RATIO = 0.25;
/** Budget threshold below which a budget-warning decision is recorded. */
export const BUDGET_CRITICAL_RATIO = 0.1;

// ─── verb costs ─────────────────────────────────────────────────
//
// Disciplined verbs are cheap; aggressive verbs (draft, revise,
// review) are expensive; rest is the primary replenishment;
// defer is mildly replenishing (conserves the budget).

export const VERB_COSTS: Record<string, number> = {
  observe:   1,
  notice:    1,
  consider:  1,
  restrain:  0.5,
  permit:    2,
  prepare:   2,
  draft:     4,
  review:    3,
  revise:    4,
  approve:   3,
  propose:   3,
  defer:    -2,    // negative = replenish
  rest:    -12,
};

/** A refusal still costs cognition (the organism still thought),
 *  but only half as much as success. Pure refusals like
 *  permit-refused never replenish. */
export const REFUSAL_COST_FACTOR = 0.5;

export function costForDirective(directiveName: string): number {
  if (directiveName.endsWith('-refused')) {
    const base = directiveName.replace('-refused', '');
    const cost = VERB_COSTS[base] ?? 1;
    // refused verbs always COST something (never replenish), at half rate
    return Math.max(0.5, Math.abs(cost) * REFUSAL_COST_FACTOR);
  }
  return VERB_COSTS[directiveName] ?? 1;
}

// ─── zone classification (with hysteresis) ─────────────────────

/** Where on the 0..10 reliability scale each zone lives, ignoring
 *  hysteresis. Reference only — actual transitions use the
 *  banded function below. */
export function trustZoneForScore(score: number): TrustZone {
  if (score >= 7.5) return 'high-trust';
  if (score >= 5.5) return 'watchful';
  if (score >= 3.5) return 'restricted';
  return 'suspended';
}

/** Hysteresis-banded transition: to demote you must drop 0.5 below
 *  the entry threshold; to promote you must rise 0.5 above the exit
 *  threshold. Prevents thrash near boundaries. */
export function trustZoneTransition(prev: TrustZone, score: number): TrustZone {
  if (prev === 'high-trust') {
    return score < 7.0 ? 'watchful' : 'high-trust';
  }
  if (prev === 'watchful') {
    if (score < 5.0) return 'restricted';
    if (score >= 8.0) return 'high-trust';
    return 'watchful';
  }
  if (prev === 'restricted') {
    if (score < 3.0) return 'suspended';
    if (score >= 6.0) return 'watchful';
    return 'restricted';
  }
  // suspended
  return score >= 4.0 ? 'restricted' : 'suspended';
}

// ─── budget evolution ───────────────────────────────────────────

export function evolveBudget(
  budget: CognitiveBudget, directiveName: string, at: number,
): CognitiveBudget {
  const cost = costForDirective(directiveName);
  let next = budget.current - cost;
  if (next < 0) next = 0;
  if (next > budget.max) next = budget.max;
  const consumed = Math.max(0, cost);
  const replenished = Math.max(0, -cost);
  return {
    current: round2(next),
    max: budget.max,
    consumedTotal: round2(budget.consumedTotal + consumed),
    replenishedTotal: round2(budget.replenishedTotal + replenished),
    lastConsumedAt: consumed > 0 ? at : budget.lastConsumedAt,
    lastReplenishedAt: replenished > 0 ? at : budget.lastReplenishedAt,
  };
}

// ─── instability forecasting ───────────────────────────────────

/** Linear-regression slope of governance's own per-event reliability
 *  samples. Governance samples cumulativeReliabilityScore on every
 *  update — so the series is always as dense as cognitive events,
 *  unlike the meta-cognitive histories which only record on
 *  significant deltas. Returns null when fewer than 3 samples exist. */
export function computeInstabilityForecast(
  samples: ReliabilitySample[],
  currentReliability: number,
  at: number, tick: number,
  horizonEvents: number = FORECAST_HORIZON_EVENTS,
): InstabilityForecast | null {
  if (samples.length < 3) return null;
  const series = samples.slice(-RELIABILITY_SAMPLES_LIMIT).map((s) => s.score);
  const n = series.length;
  const xMean = (n - 1) / 2;
  const yMean = series.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (series[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const projected = round1(clamp10(currentReliability + slope * horizonEvents));
  return {
    computedAt: at, computedTick: tick,
    currentReliability,
    reliabilitySlope: round2(slope),
    projectedReliability: projected,
    projectedZone: trustZoneForScore(projected),
    horizonEvents,
  };
}

// ─── gradient composition ──────────────────────────────────────

/** Per-zone base gradients. high-trust = neutral; restriction
 *  deepens monotonically through the zones. */
const ZONE_BASE: Record<TrustZone, RegulationGradients> = {
  'high-trust': { ...NEUTRAL_GRADIENTS },
  'watchful': {
    cognitionThroughput: 0.85,
    escalationPermission: 0.8,
    explorationIntensity: 0.85,
    deferAcceptance: 0.65,
    recoveryWeighting: 0.65,
    burstTolerance: 0.7,
  },
  'restricted': {
    cognitionThroughput: 0.6,
    escalationPermission: 0.5,
    explorationIntensity: 0.5,
    deferAcceptance: 0.8,
    recoveryWeighting: 0.85,
    burstTolerance: 0.4,
  },
  'suspended': {
    cognitionThroughput: 0.3,
    escalationPermission: 0.2,
    explorationIntensity: 0.2,
    deferAcceptance: 1.0,
    recoveryWeighting: 1.0,
    burstTolerance: 0.1,
  },
};

export function composeGradients(
  zone: TrustZone, budget: CognitiveBudget,
  forecast: InstabilityForecast | null,
  /** 0..10 — the maximum CURRENT tensionScore across pairs (bounded),
   *  NOT the lifetime cumulative tension accumulator. */
  maxPairTension: number,
): RegulationGradients {
  const base = ZONE_BASE[zone];

  const budgetRatio = budget.current / budget.max;
  const budgetPressure = budgetRatio < BUDGET_LOW_RATIO
    ? (BUDGET_LOW_RATIO - budgetRatio) * 2  // 0 → 0.5 as ratio drops 0.25 → 0
    : 0;

  const forecastPressure = forecast && forecast.projectedReliability < 4
    ? (4 - forecast.projectedReliability) * 0.05
    : 0;

  const tensionPressure = maxPairTension > 6
    ? (maxPairTension - 6) * 0.04
    : 0;

  return {
    cognitionThroughput:  clamp01(round2(base.cognitionThroughput  - budgetPressure - forecastPressure - tensionPressure)),
    escalationPermission: clamp01(round2(base.escalationPermission - forecastPressure - tensionPressure)),
    explorationIntensity: clamp01(round2(base.explorationIntensity - budgetPressure - forecastPressure)),
    deferAcceptance:      clamp01(round2(base.deferAcceptance      + budgetPressure + forecastPressure + tensionPressure)),
    recoveryWeighting:    clamp01(round2(base.recoveryWeighting    + budgetPressure + forecastPressure + tensionPressure)),
    burstTolerance:       clamp01(round2(base.burstTolerance       - budgetPressure - forecastPressure)),
  };
}

function gradientMaxDelta(a: RegulationGradients, b: RegulationGradients): number {
  let max = 0;
  const keys: (keyof RegulationGradients)[] = [
    'cognitionThroughput', 'escalationPermission', 'explorationIntensity',
    'deferAcceptance', 'recoveryWeighting', 'burstTolerance',
  ];
  for (const k of keys) {
    const d = Math.abs(a[k] - b[k]);
    if (d > max) max = d;
  }
  return max;
}

// ─── soft-throttling helpers ───────────────────────────────────

/** Wave 35 — governed escalation threshold. Layer it ON TOP of the
 *  Wave 34 adaptive value. When escalation permission is < 1.0, the
 *  threshold rises so that the same opposing pressure is less likely
 *  to push tension up. */
export function governEscalationThreshold(adaptive: number, g: RegulationGradients): number {
  const restriction = 1 - g.escalationPermission;
  return round1(clamp10(adaptive + restriction * 2));
}

/** Wave 35 — governed defer thresholds. defer-acceptance > 0.5 makes
 *  defer EASIER to recommend (lower fragmentation bars, higher cadence
 *  bars, lower density bar). < 0.5 makes it harder. */
export function governDeferThresholds(
  adaptive: AdaptiveDeferThresholds, g: RegulationGradients,
): AdaptiveDeferThresholds {
  const ease = (g.deferAcceptance - 0.5) * 2; // -1 (hard) → +1 (easy)
  return {
    fragmentationRiskNow:    round1(clamp10(adaptive.fragmentationRiskNow - ease * 1.0)),
    cadenceHealthNow:        round1(clamp10(adaptive.cadenceHealthNow     + ease * 0.5)),
    fragmentationRiskSoon:   round1(clamp10(adaptive.fragmentationRiskSoon - ease * 1.0)),
    cadenceHealthSoon:       round1(clamp10(adaptive.cadenceHealthSoon     + ease * 0.5)),
    cognitionDensitySoon:    round1(clamp10(adaptive.cognitionDensitySoon  - ease * 1.0)),
    recoveryEfficiencyNotYet: round1(clamp10(adaptive.recoveryEfficiencyNotYet + ease * 0.5)),
    approvalStabilityNotYet: round1(clamp10(adaptive.approvalStabilityNotYet  + ease * 0.5)),
  };
}

/** Wave 35 — governed rest thresholds. recovery-weighting > 0.5 makes
 *  rest fire EARLIER (energy threshold raised so rest accepts at higher
 *  reserves; stress / complexity thresholds lowered). < 0.5 delays rest. */
export function governRestThresholds(
  adaptive: AdaptiveRestThresholds, g: RegulationGradients,
): AdaptiveRestThresholds {
  const ease = (g.recoveryWeighting - 0.5) * 2;
  return {
    energyLow:        round1(clamp10(adaptive.energyLow      + ease * 1.0)),
    stressHigh:       round1(clamp10(adaptive.stressHigh     - ease * 1.0)),
    complexityHigh:   round1(clamp10(adaptive.complexityHigh - ease * 1.0)),
    fragmentHigh:     adaptive.fragmentHigh,
    pendingEnergyLow: round1(clamp10(adaptive.pendingEnergyLow + ease * 1.0)),
  };
}

// ─── main update ───────────────────────────────────────────────

export interface GovernanceSignal {
  at: number;
  tick: number;
  directiveName: string;
  meta: MetaCognitiveState;
  contradiction: ContradictionMemoryState | null;
  temporal: TemporalMemoryState | null;
}

export function updateGovernance(
  state: CognitiveGovernanceState, signal: GovernanceSignal,
): CognitiveGovernanceState {
  // 1. Budget evolution from this directive.
  const budget = evolveBudget(state.budget, signal.directiveName, signal.at);

  // 2. Sample cumulative reliability + compute forecast from the
  //    rolling sample buffer (dense — one sample per cognitive event).
  const newSample: ReliabilitySample = {
    at: signal.at, tick: signal.tick,
    score: signal.meta.cumulativeReliabilityScore,
  };
  const reliabilitySamples = [...state.reliabilitySamples, newSample]
    .slice(-RELIABILITY_SAMPLES_LIMIT);
  const forecast = computeInstabilityForecast(
    reliabilitySamples, signal.meta.cumulativeReliabilityScore,
    signal.at, signal.tick,
  );

  // 3. Zone transition driven by cumulative reliability with hysteresis.
  const nextZone = trustZoneTransition(state.zone, signal.meta.cumulativeReliabilityScore);

  // 4. Compose gradients from zone + budget + forecast + max current
  //    pair tension (bounded 0..10, NOT the lifetime cumulative).
  const maxPairTension = signal.contradiction
    ? signal.contradiction.pairs.reduce((m, p) => Math.max(m, p.tensionScore), 0)
    : 0;
  const gradients = composeGradients(nextZone, budget, forecast, maxPairTension);

  // 5. Record decisions worth logging.
  const decisions: DecisionRecord[] = [];

  if (nextZone !== state.zone) {
    decisions.push({
      at: signal.at, tick: signal.tick,
      kind: 'zone-transition',
      fromZone: state.zone, toZone: nextZone,
      reason: `reliability ${signal.meta.cumulativeReliabilityScore.toFixed(1)}/10 crossed band`,
    });
  }

  const budgetRatio = budget.current / budget.max;
  const prevBudgetRatio = state.budget.current / state.budget.max;
  if (budgetRatio < BUDGET_CRITICAL_RATIO && prevBudgetRatio >= BUDGET_CRITICAL_RATIO) {
    decisions.push({
      at: signal.at, tick: signal.tick,
      kind: 'budget-warning',
      reason: `budget ${budget.current.toFixed(1)}/${budget.max} below ${Math.round(BUDGET_CRITICAL_RATIO * 100)}%`,
    });
  }

  if (forecast && forecast.projectedReliability < 4
      && (!state.forecast || state.forecast.projectedReliability >= 4)) {
    decisions.push({
      at: signal.at, tick: signal.tick,
      kind: 'forecast-warning',
      reason: `projected reliability ${forecast.projectedReliability.toFixed(1)}/10 in ${forecast.horizonEvents} events (slope ${forecast.reliabilitySlope.toFixed(2)})`,
    });
  }

  const gradientDelta = gradientMaxDelta(state.gradients, gradients);
  let significantShifts = state.significantShifts;
  if (gradientDelta >= GRADIENT_SHIFT_THRESHOLD) {
    significantShifts += 1;
    if (gradientDelta >= 0.2) {
      decisions.push({
        at: signal.at, tick: signal.tick,
        kind: 'gradient-shift',
        reason: `max gradient delta ${gradientDelta.toFixed(2)} (zone ${nextZone}, budget ${budgetRatio.toFixed(2)})`,
      });
    }
  }

  const zoneTransitions = state.zoneTransitions + (nextZone !== state.zone ? 1 : 0);

  return {
    zone: nextZone,
    budget,
    gradients,
    forecast,
    decisionHistory: [...state.decisionHistory, ...decisions],
    reliabilitySamples,
    zoneTransitions,
    significantShifts,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };
}
