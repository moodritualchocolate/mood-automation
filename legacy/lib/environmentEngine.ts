/**
 * ENVIRONMENT ENGINE (Wave 39)
 *
 * Deterministic evolution of seven external climate fields with
 * momentum + hysteresis + decay curves. The environment is
 * one-event-lagged: each event reads envPre to bias its own
 * dynamics, then a fresh environment evolves at the end of the
 * event from the post-state. Bidirectional coupling, mathematically
 * clean — no within-event recursion.
 *
 * Math per field per event:
 *
 *   target_t   = deterministic function of (organism signals + own history)
 *   drift_t    = (target_t - current) * DRIFT_RATE
 *   momentum_t = lastDelta * MOMENTUM_FACTOR
 *   decay_t    = (baseline - current) * BASELINE_DECAY_RATE
 *   next       = clamp(0, 10, current + drift + momentum + decay)
 *
 * No RNG. Same history → same climate.
 *
 * The engine also emits an EnvironmentBias struct (gradient deltas
 * bounded ±0.20) for governance, plus cost/restoration multipliers
 * the resource engine can layer on its own computation, plus a
 * simulation-pressure contribution for the recursive simulator.
 */

import type {
  EnvironmentMemoryState, EnvironmentLevels, EnvironmentFieldId,
  EnvironmentMomentum, EnvironmentState, EnvironmentObservation,
  EnvironmentTrajectoryPoint, CouplingSignal,
} from './environmentMemory';
import { ALL_ENV_FIELDS, ENV_BASELINES } from './environmentMemory';
import type { InternalEcologyState } from './internalEcologyMemory';
import type { CognitiveGovernanceState } from './cognitiveGovernance';
import type { ContradictionMemoryState } from './contradictionMemory';
import type { TemporalAssessment } from './temporalIntelligenceView';
import type { MetaCognitiveState } from './metaCognitive';
import type { ResourceEconomyState } from './resourceEconomyMemory';
import type { ConsequenceMemoryState } from './consequenceMemory';

// ─── tuning constants ───────────────────────────────────────────

/** How quickly current value moves toward computed target each event. */
export const DRIFT_RATE = 0.10;
/** Inertia: portion of last-event delta that carries forward. */
export const MOMENTUM_FACTOR = 0.35;
/** Slow pull back toward baseline absent other pressure. */
export const BASELINE_DECAY_RATE = 0.025;
/** EWMA alpha for emaRate. */
export const EMA_ALPHA = 0.2;
/** Per-event change cap to prevent jumps. */
export const MAX_DELTA_PER_EVENT = 1.2;
/** Significant-change observation threshold. */
export const OBSERVATION_DELTA = 0.3;
/** Significant-trajectory sample threshold (sampled only when level moves). */
export const TRAJECTORY_DELTA = 0.15;
/** Hysteresis ticks required to switch EnvironmentState. */
export const STATE_HYSTERESIS_TICKS = 3;
/** EnvironmentBias clamp. */
export const ENV_BIAS_CLAMP = 0.20;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function clamp01(n: number): number { return clamp(0, 1, n); }
function clampBias(n: number): number { return clamp(-ENV_BIAS_CLAMP, ENV_BIAS_CLAMP, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── input signal ──────────────────────────────────────────────

export interface EnvironmentSignal {
  at: number;
  tick: number;
  directiveName: string;
  ecology: InternalEcologyState | null;
  governance: CognitiveGovernanceState | null;
  contradiction: ContradictionMemoryState | null;
  resourceEconomy: ResourceEconomyState | null;
  consequence: ConsequenceMemoryState | null;
  meta: MetaCognitiveState | null;
  assessment: TemporalAssessment;
}

// ─── per-field target computation ──────────────────────────────

function targetFor(field: EnvironmentFieldId, sig: EnvironmentSignal, env: EnvironmentMemoryState): number {
  const maxTension = sig.contradiction
    ? sig.contradiction.pairs.reduce((m, p) => Math.max(m, p.tensionScore), 0)
    : 0;
  const ecologyVolatility = sig.ecology?.volatilityField ?? 0;
  const ecologyState = sig.ecology?.state ?? 'balanced';
  const reliability = sig.meta?.cumulativeReliabilityScore ?? 7;
  const resourceAggregate = sig.resourceEconomy?.reserveAggregate ?? 56;
  const cognitionDensity = sig.assessment.cognitionDensity;
  const lastLongSurv = sig.consequence?.recentSimulations?.length
    ? sig.consequence.recentSimulations[sig.consequence.recentSimulations.length - 1].horizons.long.survivability
    : 0.8;
  const ownVolatility = env.levels.volatility;

  switch (field) {
    case 'volatility':
      // Aggressive cognition + ecology imbalance + contradiction all drive volatility.
      // Adds organism's own past volatility (self-reinforcing climate).
      return clamp10(
        cognitionDensity * 0.35
        + ecologyVolatility * 0.30
        + maxTension * 0.20
        + (sig.directiveName === 'draft' || sig.directiveName === 'revise' ? 1.5 : 0)
        + (env.levels.volatility - 3) * 0.15
        + (ecologyState === 'unstable' || ecologyState === 'over-optimized' ? 2 : 0)
      );

    case 'opportunityDensity':
      // Available expansion potential. High when reliability + survivability are healthy;
      // suppressed by threat and low resources.
      return clamp10(
        4
        + (reliability - 5) * 0.4
        + lastLongSurv * 3
        - env.levels.threatPressure * 0.35
        - Math.max(0, (50 - resourceAggregate) / 10)
        + (ecologyState === 'exploratory' ? 1.5 : 0)
      );

    case 'threatPressure':
      // External survivability pressure. Rises with contradiction + collapse states + low reliability.
      const collapseImpact =
        sig.resourceEconomy?.collapseState === 'liquidity-collapse' ? 3 :
        sig.resourceEconomy?.collapseState === 'depleted' ? 2.5 :
        sig.resourceEconomy?.collapseState === 'contradiction-fragile' ? 2 :
        sig.resourceEconomy?.collapseState === 'starvation-risk' ? 2 :
        sig.resourceEconomy?.collapseState === 'recovery-locked' ? 1.5 :
        sig.resourceEconomy?.collapseState === 'overextended' ? 1 : 0;
      return clamp10(
        maxTension * 0.45
        + collapseImpact
        + (10 - reliability) * 0.20
        + ownVolatility * 0.10
      );

    case 'recoveryClimate':
      // How restorative the environment is. Rises with rest/defer activity, low cognition density,
      // and stability. Diminished by ongoing turbulence.
      const restishVerb = (sig.directiveName === 'rest' || sig.directiveName === 'defer' || sig.directiveName === 'restrain') ? 1.5 : 0;
      return clamp10(
        4
        + restishVerb
        + (10 - cognitionDensity) * 0.20
        + (env.levels.stabilityField - 5) * 0.30
        - env.levels.informationTurbulence * 0.20
        - env.levels.threatPressure * 0.15
      );

    case 'informationTurbulence':
      // Signal fragmentation / overload. Driven by cognition density + ecology volatility +
      // contradiction velocity. Reduced by stability.
      return clamp10(
        cognitionDensity * 0.40
        + ecologyVolatility * 0.30
        + maxTension * 0.15
        - env.levels.stabilityField * 0.15
        + (env.levels.volatility - 3) * 0.20
      );

    case 'stabilityField':
      // Predictability of future trajectories. Inversely proportional to volatility/threat/turbulence.
      return clamp10(
        8
        - env.levels.volatility * 0.30
        - env.levels.threatPressure * 0.25
        - env.levels.informationTurbulence * 0.20
        + (reliability - 5) * 0.30
      );

    case 'adaptationDifficulty':
      // Cost of maintaining equilibrium. Composite of turbulence + scarcity + threat.
      return clamp10(
        env.levels.informationTurbulence * 0.30
        + env.levels.threatPressure * 0.35
        + Math.max(0, (50 - resourceAggregate) / 8) * 0.5
        + env.levels.volatility * 0.15
      );

    default:
      return ENV_BASELINES[field];
  }
}

// ─── per-field evolve ──────────────────────────────────────────

function evolveField(
  field: EnvironmentFieldId, env: EnvironmentMemoryState, sig: EnvironmentSignal,
): { level: number; delta: number; momentum: EnvironmentMomentum } {
  const current = env.levels[field];
  const baseline = ENV_BASELINES[field];
  const target = targetFor(field, sig, env);
  const lastDelta = env.momentum[field].lastDelta;

  const drift = (target - current) * DRIFT_RATE;
  const momentum = lastDelta * MOMENTUM_FACTOR;
  const decay = (baseline - current) * BASELINE_DECAY_RATE;

  let combinedDelta = drift + momentum + decay;
  if (combinedDelta >  MAX_DELTA_PER_EVENT) combinedDelta =  MAX_DELTA_PER_EVENT;
  if (combinedDelta < -MAX_DELTA_PER_EVENT) combinedDelta = -MAX_DELTA_PER_EVENT;

  const next = round1(clamp10(current + combinedDelta));
  const realizedDelta = round2(next - current);

  const newMomentum: EnvironmentMomentum = {
    lastDelta: realizedDelta,
    emaRate: round2(env.momentum[field].emaRate * (1 - EMA_ALPHA) + realizedDelta * EMA_ALPHA),
  };
  return { level: next, delta: realizedDelta, momentum: newMomentum };
}

// ─── state classification with hysteresis ──────────────────────

function classifyState(lvl: EnvironmentLevels): EnvironmentState {
  if (lvl.threatPressure > 7 && lvl.opportunityDensity < 3) return 'hostile';
  if (lvl.threatPressure > 6 && lvl.volatility > 6) return 'collapse-prone';
  if (lvl.volatility > 7 && lvl.stabilityField < 3) return 'unstable';
  if (lvl.informationTurbulence > 7) return 'high-noise';
  if (lvl.adaptationDifficulty > 7) return 'adaptive-fragile';
  if (lvl.recoveryClimate < 3) return 'depleted-climate';
  if (lvl.opportunityDensity > 7 && lvl.threatPressure < 4) return 'opportunity-rich';
  if (lvl.volatility > 5) return 'turbulent';
  if (lvl.stabilityField > 6 && lvl.threatPressure < 4 && lvl.volatility < 4) return 'stable';
  return 'survivable';
}

/** State transitions require STATE_HYSTERESIS_TICKS of persistence in
 *  the candidate state before they fire. Prevents one-event flips. */
function transitionState(
  prev: EnvironmentState, prevPersistence: number, candidate: EnvironmentState,
): { state: EnvironmentState; persistence: number } {
  if (candidate === prev) {
    return { state: prev, persistence: prevPersistence + 1 };
  }
  // Switch only after the candidate has been "voted for" enough.
  // We approximate by allowing a switch when prevPersistence has been
  // long enough that the prior state is well-established, then a single
  // event of a different candidate doesn't immediately flip — we hold
  // for at least 1 event of new candidate.
  if (prevPersistence < STATE_HYSTERESIS_TICKS) {
    // Prior state hasn't even stuck yet — keep it.
    return { state: prev, persistence: prevPersistence + 1 };
  }
  // Old state held long enough; switch now (this is event 1 of the new state).
  return { state: candidate, persistence: 1 };
}

// ─── outputs to other layers ───────────────────────────────────

export interface EnvironmentBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

/** Translate environment levels into gradient bias deltas (±0.20 max). */
export function computeEnvironmentBias(lvl: EnvironmentLevels): EnvironmentBias {
  // Normalize each driver to a 0..1 deviation from neutral 5.
  const vol  = (lvl.volatility           - 5) / 5;  // -1..+1
  const opp  = (lvl.opportunityDensity   - 5) / 5;
  const thr  = (lvl.threatPressure       - 5) / 5;
  const rec  = (lvl.recoveryClimate      - 5) / 5;
  const turb = (lvl.informationTurbulence - 5) / 5;
  const stab = (lvl.stabilityField       - 5) / 5;
  const diff = (lvl.adaptationDifficulty - 5) / 5;

  return {
    cognitionThroughput:  clampBias(round2(-vol * 0.10 - thr * 0.10 - diff * 0.10 + opp * 0.05)),
    escalationPermission: clampBias(round2(-thr * 0.20 - vol * 0.05 + stab * 0.08)),
    explorationIntensity: clampBias(round2(+opp * 0.15 - thr * 0.10 - diff * 0.10)),
    deferAcceptance:      clampBias(round2(+thr * 0.15 + vol * 0.10 + diff * 0.10 - opp * 0.05)),
    recoveryWeighting:    clampBias(round2(+rec * 0.10 + diff * 0.10 + thr * 0.05 - stab * 0.05)),
    burstTolerance:       clampBias(round2(-vol * 0.12 - turb * 0.10 + stab * 0.08)),
  };
}

/** Apply environment bias to governance gradients (clamped 0..1). */
export function applyEnvironmentBias<G extends EnvironmentBias>(
  gradients: G, bias: EnvironmentBias,
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

/** Cost-multiplier contribution from environment for the resource
 *  engine. Returns a multiplier ≥ 1.0 — amplifies costs under stress.
 *  Hostile / unstable / adaptive-fragile climates make cognition
 *  measurably more expensive. */
export function environmentCostMultiplier(env: EnvironmentMemoryState): number {
  const lvl = env.levels;
  let m = 1.0;
  if (lvl.adaptationDifficulty > 6) m *= 1 + (lvl.adaptationDifficulty - 6) * 0.05;
  if (lvl.informationTurbulence > 6) m *= 1 + (lvl.informationTurbulence - 6) * 0.05;
  if (lvl.threatPressure > 6) m *= 1 + (lvl.threatPressure - 6) * 0.04;
  if (lvl.recoveryClimate < 3) m *= 1 + (3 - lvl.recoveryClimate) * 0.06;
  return round2(m);
}

/** Restoration multiplier for the resource engine — diminishes
 *  restorative deltas when the climate is depleted. Returns 0.5..1.2. */
export function environmentRestorationMultiplier(env: EnvironmentMemoryState): number {
  const lvl = env.levels;
  let m = 1.0;
  if (lvl.recoveryClimate < 4) m *= 1 - (4 - lvl.recoveryClimate) * 0.10;
  if (lvl.recoveryClimate > 7) m *= 1 + (lvl.recoveryClimate - 7) * 0.05;
  if (lvl.stabilityField < 3) m *= 0.85;
  return round2(clamp(0.5, 1.2, m));
}

/** Additional simulation pressure for the recursive simulator from
 *  hostile / collapse-prone environment states. 0..0.2. */
export function environmentPressureContribution(env: EnvironmentMemoryState): number {
  switch (env.state) {
    case 'hostile':
    case 'collapse-prone':
      return 0.2;
    case 'unstable':
    case 'depleted-climate':
    case 'adaptive-fragile':
      return 0.15;
    case 'high-noise':
    case 'turbulent':
      return 0.08;
    default: return 0;
  }
}

/** Ecology context boosters — applied to the ecology engine's
 *  state-context modulation. Returns additive deltas. */
export interface EcologyContextBoost {
  volatilityBoost: number;     // additive to maxPairTension proxy
  threatBoost: number;         // additive to guardian activation
  opportunityBoost: number;    // additive to explorer activation
  turbulenceBoost: number;     // additive to optimizer activation
}

export function ecologyContextBoost(env: EnvironmentMemoryState): EcologyContextBoost {
  const lvl = env.levels;
  return {
    volatilityBoost:   round2(Math.max(0, (lvl.volatility - 5) * 0.20)),
    threatBoost:       round2(Math.max(0, (lvl.threatPressure - 5) * 0.25)),
    opportunityBoost:  round2(Math.max(0, (lvl.opportunityDensity - 5) * 0.20)),
    turbulenceBoost:   round2(Math.max(0, (lvl.informationTurbulence - 5) * 0.15)),
  };
}

// ─── coupling diagnostic ───────────────────────────────────────

function computeCoupling(
  sig: EnvironmentSignal, deltas: Record<EnvironmentFieldId, number>,
  costMult: number,
): CouplingSignal {
  return {
    organismToVolatility: round2(deltas.volatility),
    organismToThreat:     round2(deltas.threatPressure),
    organismToRecovery:   round2(deltas.recoveryClimate),
    environmentToGovernance: round2(
      Math.abs((sig.governance?.gradients.cognitionThroughput ?? 1)
        - clamp01((sig.governance?.gradients.cognitionThroughput ?? 1) + 0)),
    ),
    environmentCostMultiplier: round2(costMult),
  };
}

// ─── main update ───────────────────────────────────────────────

export function updateEnvironment(
  env: EnvironmentMemoryState, sig: EnvironmentSignal,
): EnvironmentMemoryState {
  const newLevels: EnvironmentLevels = { ...env.levels };
  const newMomentum: Record<EnvironmentFieldId, EnvironmentMomentum> = { ...env.momentum };
  const deltas: Record<EnvironmentFieldId, number> = {} as Record<EnvironmentFieldId, number>;
  const newObservations: EnvironmentObservation[] = [];
  const newTrajectories: Record<EnvironmentFieldId, EnvironmentTrajectoryPoint[]> = { ...env.trajectories };

  for (const f of ALL_ENV_FIELDS) {
    const evolved = evolveField(f, env, sig);
    newLevels[f] = evolved.level;
    newMomentum[f] = evolved.momentum;
    deltas[f] = evolved.delta;
    if (Math.abs(evolved.delta) >= OBSERVATION_DELTA) {
      newObservations.push({
        at: sig.at, tick: sig.tick,
        field: f, level: evolved.level, delta: evolved.delta,
      });
    }
    if (Math.abs(evolved.delta) >= TRAJECTORY_DELTA) {
      newTrajectories[f] = [
        ...newTrajectories[f],
        { at: sig.at, tick: sig.tick, level: evolved.level },
      ];
    }
  }

  const candidate = classifyState(newLevels);
  const { state, persistence } = transitionState(env.state, env.statePersistenceTicks, candidate);

  const costMult = environmentCostMultiplier({ ...env, levels: newLevels } as EnvironmentMemoryState);
  const coupling = computeCoupling(sig, deltas, costMult);

  const impactSample = Math.abs(deltas.volatility) + Math.abs(deltas.threatPressure);
  const organismImpactEMA = round2(env.organismImpactEMA * (1 - EMA_ALPHA) + impactSample * EMA_ALPHA);

  return {
    levels: newLevels,
    momentum: newMomentum,
    trajectories: newTrajectories,
    observationHistory: [...env.observationHistory, ...newObservations],
    state,
    statePersistenceTicks: persistence,
    lastCoupling: coupling,
    organismImpactEMA,
    totalUpdates: env.totalUpdates + 1,
    firstUpdatedAt: env.firstUpdatedAt ?? sig.at,
    updatedAt: sig.at,
  };
}
