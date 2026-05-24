/**
 * STRATEGIC SIMULATION ENGINE (Wave 36)
 *
 * Deterministic forward projection of operational trajectory.
 * NOT narrative planning. The simulator answers ONE question:
 *
 *   "If the organism continues operating under its current
 *    regulation gradients for N steps, what does its trajectory
 *    look like, and is it survivable?"
 *
 * The simulation operates on a compressed seven-variable state
 * vector (reliability, budget, tension, fragmentation, energy,
 * stress, coherence). Each step applies the same decay / cost /
 * recovery rules the live system uses, biased by the current
 * RegulationGradients. Same inputs → same outputs. No RNG.
 *
 * Three horizons: short (+5), medium (+20), long (+50).
 * Survivability scored from how many vitals end in healthy ranges.
 *
 * The long-horizon survivability feeds back into governance's
 * gradient composition — recursive weighting. Each event uses the
 * PREVIOUS simulation's long-horizon survivability as a pressure
 * signal; the new simulation then projects forward from the
 * updated state.
 */

import type {
  SimulatedState,
  SimulationHorizonResult,
  SimulationRecord,
  ConsequenceMemoryState,
  VerbCostStat,
} from './consequenceMemory';
import { COST_EWMA_ALPHA } from './consequenceMemory';
import type { RegulationGradients } from './cognitiveGovernance';
import { BUDGET_MAX } from './cognitiveGovernance';

// ─── horizon definitions ───────────────────────────────────────

export const HORIZON_SHORT = 5;
export const HORIZON_MEDIUM = 20;
export const HORIZON_LONG = 50;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── single-step model ─────────────────────────────────────────
//
// Per-step update for the seven trajectory variables. Each variable
// has a clearly-named decay / consumption / restoration component.
// Coefficients are fixed constants; the only state-dependent input
// is the RegulationGradients, which determine throughput vs recovery
// bias.

export function stepForward(
  s: SimulatedState, g: RegulationGradients,
): SimulatedState {
  // RELIABILITY — drifts toward 5 baseline. Aggressive throughput
  // accelerates the drift away from current value (more events =
  // more chances for instability); recovery brings it back.
  const reliabilityDrift = (5 - s.reliability) * 0.04;
  const reliabilityFromThroughput = (g.cognitionThroughput - 0.5) * -0.08;
  const reliability = clamp10(s.reliability + reliabilityDrift + reliabilityFromThroughput);

  // BUDGET — consumption proportional to throughput, restoration
  // proportional to recoveryWeighting (the gradient toward rest).
  const consume = g.cognitionThroughput * 2.5;
  const restore = g.recoveryWeighting * 1.2;
  const budget = clamp(0, BUDGET_MAX, s.budget - consume + restore);

  // TENSION — grows with throughput + escalation permission, decays
  // with defer acceptance. Bounded 0..10.
  const tensionGrowth = g.cognitionThroughput * g.escalationPermission * 0.25;
  const tensionDecay  = g.deferAcceptance * 0.18;
  const maxTension = clamp10(s.maxTension + tensionGrowth - tensionDecay);

  // FRAGMENTATION — increments while tension stays high, drains
  // otherwise. Burst tolerance amplifies the rise rate.
  const fragmentationStreak = maxTension > 7
    ? s.fragmentationStreak + (g.burstTolerance > 0.5 ? 1 : 0.5)
    : Math.max(0, s.fragmentationStreak - 0.5);

  // ENERGY — depletes with throughput, replenishes with recovery.
  const energy = clamp10(s.energy
    - g.cognitionThroughput * 0.25
    + g.recoveryWeighting * 0.18);

  // STRESS — rises with throughput + tension pressure, falls with
  // recovery weighting.
  const stress = clamp10(s.stress
    + g.cognitionThroughput * 0.18
    + s.maxTension * 0.025
    - g.recoveryWeighting * 0.22);

  // COHERENCE — drifts toward 5, eroded by sustained fragmentation,
  // protected by low exploration intensity (less drift if exploration
  // is held back).
  const coherenceDrift = (5 - s.coherence) * 0.03;
  const coherenceErosion = fragmentationStreak * 0.04;
  const coherenceProtection = (1 - g.explorationIntensity) * 0.04;
  const coherence = clamp10(s.coherence + coherenceDrift - coherenceErosion + coherenceProtection);

  return {
    reliability: round1(reliability),
    budget: round1(budget),
    maxTension: round1(maxTension),
    fragmentationStreak: round1(fragmentationStreak),
    energy: round1(energy),
    stress: round1(stress),
    coherence: round1(coherence),
  };
}

// ─── survivability scoring ─────────────────────────────────────

/** Each vital is one survival point if in its healthy range. */
const SURVIVAL_CHECKS: Array<{ key: keyof SimulatedState; ok: (n: number) => boolean }> = [
  { key: 'reliability',         ok: (n) => n >= 4 },
  { key: 'budget',              ok: (n) => n > 10 },
  { key: 'maxTension',          ok: (n) => n < 7 },
  { key: 'fragmentationStreak', ok: (n) => n < 5 },
  { key: 'energy',              ok: (n) => n > 2 },
  { key: 'stress',              ok: (n) => n < 8 },
  { key: 'coherence',           ok: (n) => n > 3 },
];

export function survivabilityOf(state: SimulatedState): number {
  const passed = SURVIVAL_CHECKS.filter((c) => c.ok(state[c.key])).length;
  return round2(passed / SURVIVAL_CHECKS.length);
}

function enteredCriticalAt(s: SimulatedState): boolean {
  return s.maxTension > 8 || s.fragmentationStreak > 6 || s.budget === 0;
}

// ─── horizon projection ───────────────────────────────────────

export function projectHorizon(
  start: SimulatedState, gradients: RegulationGradients, horizonSteps: number,
): SimulationHorizonResult {
  let cur = start;
  let enteredCritical = false;
  // sample at start, mid, end (3 points) for inspection
  const midIdx = Math.floor(horizonSteps / 2);
  const samples: SimulatedState[] = [start];
  for (let i = 0; i < horizonSteps; i++) {
    cur = stepForward(cur, gradients);
    if (enteredCriticalAt(cur)) enteredCritical = true;
    if (i + 1 === midIdx) samples.push(cur);
  }
  samples.push(cur);
  return {
    horizonSteps,
    endState: cur,
    samples,
    survivability: survivabilityOf(cur),
    enteredCritical,
  };
}

// ─── full multi-horizon simulation ─────────────────────────────

export function simulateTrajectory(
  start: SimulatedState, gradients: RegulationGradients,
): {
  short: SimulationHorizonResult;
  medium: SimulationHorizonResult;
  long: SimulationHorizonResult;
} {
  return {
    short:  projectHorizon(start, gradients, HORIZON_SHORT),
    medium: projectHorizon(start, gradients, HORIZON_MEDIUM),
    long:   projectHorizon(start, gradients, HORIZON_LONG),
  };
}

// ─── cost-map sampling ─────────────────────────────────────────

/** EWMA-update a single cost stat. */
function ewmaUpdate(prev: number, sample: number, samples: number): number {
  if (samples <= 0) return sample;
  return round2(prev * (1 - COST_EWMA_ALPHA) + sample * COST_EWMA_ALPHA);
}

export function updateVerbCostMap(
  map: Record<string, VerbCostStat>,
  directiveName: string,
  budgetDelta: number,
  reliabilityDelta: number,
  tensionDelta: number,
  at: number,
): Record<string, VerbCostStat> {
  const prev = map[directiveName];
  const next: VerbCostStat = prev
    ? {
        samples: prev.samples + 1,
        avgBudgetImpact: ewmaUpdate(prev.avgBudgetImpact, budgetDelta, prev.samples),
        avgReliabilityImpact: ewmaUpdate(prev.avgReliabilityImpact, reliabilityDelta, prev.samples),
        avgTensionImpact: ewmaUpdate(prev.avgTensionImpact, tensionDelta, prev.samples),
        lastSampledAt: at,
      }
    : {
        samples: 1,
        avgBudgetImpact: round2(budgetDelta),
        avgReliabilityImpact: round2(reliabilityDelta),
        avgTensionImpact: round2(tensionDelta),
        lastSampledAt: at,
      };
  return { ...map, [directiveName]: next };
}

// ─── orchestrator ──────────────────────────────────────────────

export interface SimulationSignal {
  at: number;
  tick: number;
  directiveName: string;
  start: SimulatedState;
  /** The current governance gradients — what the simulator assumes
   *  cognition will keep operating under. */
  gradients: RegulationGradients;
  /** Real observed deltas this event caused, for the cost map. */
  budgetDelta: number;
  reliabilityDelta: number;
  tensionDelta: number;
}

export function updateConsequenceMemory(
  state: ConsequenceMemoryState, signal: SimulationSignal,
): ConsequenceMemoryState {
  const horizons = simulateTrajectory(signal.start, signal.gradients);
  const record: SimulationRecord = {
    recordId: `sim-${signal.at}-${signal.tick}`,
    at: signal.at,
    tick: signal.tick,
    directiveName: signal.directiveName,
    startState: signal.start,
    horizons,
  };
  const verbCostMap = updateVerbCostMap(
    state.verbCostMap, signal.directiveName,
    signal.budgetDelta, signal.reliabilityDelta, signal.tensionDelta,
    signal.at,
  );
  return {
    recentSimulations: [...state.recentSimulations, record],
    verbCostMap,
    totalSimulations: state.totalSimulations + 1,
    firstSimulatedAt: state.firstSimulatedAt ?? signal.at,
    updatedAt: signal.at,
  };
}

// ─── helper for governance recursive weighting ────────────────

/** Pressure on the gradient composition derived from the most recent
 *  simulation. Returns a 0..1 number — higher means governance
 *  should restrict more aggressively. Two contributing signals:
 *    (a) long-horizon end-state survivability < 0.7 → linear pressure
 *    (b) ANY horizon entered a critical region during projection →
 *        flat +0.15 pressure (independent of end-state recovery)
 *  Capped at 0.5 so governance always has some headroom. */
export function simulationPressureFromConsequence(
  state: ConsequenceMemoryState,
): number {
  const last = state.recentSimulations[state.recentSimulations.length - 1];
  if (!last) return 0;
  const longSurv = last.horizons.long.survivability;
  const survPressure = longSurv >= 0.7 ? 0 : (0.7 - longSurv) * (0.5 / 0.7);
  const enteredCritical = last.horizons.short.enteredCritical
    || last.horizons.medium.enteredCritical
    || last.horizons.long.enteredCritical;
  const criticalPressure = enteredCritical ? 0.15 : 0;
  return round2(Math.min(0.5, survPressure + criticalPressure));
}
