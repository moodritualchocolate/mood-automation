/**
 * MISSION CONTINUITY ENGINE (Wave 40)
 *
 * Deterministic civilizational continuity physics. Per cognitive
 * event the engine:
 *
 *   1. computes per-vector reinforcement from a fixed direction
 *      table keyed on the directive name + a small state-context
 *      modulation (resource scarcity / contradiction tension /
 *      environmental hostility)
 *   2. degrades all vectors by their degradationRate; reinforced
 *      vectors gain weight + historicalReinforcement
 *   3. updates each vector's continuityAnchor / abandonmentResistance /
 *      mutationTolerance via EWMA blending with the new context
 *   4. classifies vector activationState with hysteresis-banded
 *      transitions over persistenceWeight (dormant / forming /
 *      active / fading / lineage-stored)
 *   5. (potentially) spawns a mutation: when a vector has sustained
 *      strong reinforcement AND the current context represents a
 *      meaningful deviation, a child vector forks with inherited
 *      lineageConnections + parent's persistenceWeight share
 *   6. computes ten top-level continuity metrics: continuityStrength,
 *      missionIntegrity, existentialDrift, lineageStability,
 *      longHorizonCoherence, adaptationContinuity, strategicPersistence,
 *      missionPressure, continuityMomentum (signed)
 *   7. classifies civilization state with persistence-banded hysteresis
 *   8. detects + records continuity conflicts (continuity vs adaptation,
 *      survival tradeoff, doctrine deviation)
 *   9. emits MissionBias struct (±0.20 per gradient) governance composes
 *      alongside ecology / scarcity / environment biases
 *
 * No narratives. No identity invention. Same history → same state.
 */

import type {
  MissionContinuityState, MissionVector, StrategicDirection,
  MissionActivationState, DriftObservation, LineageEvent,
  ContinuityConflict, CivilizationState, VectorReinforcementSample,
} from './missionContinuityMemory';
import type { InternalEcologyState } from './internalEcologyMemory';
import type { ResourceEconomyState } from './resourceEconomyMemory';
import type { EnvironmentMemoryState } from './environmentMemory';
import type { ContradictionMemoryState } from './contradictionMemory';
import type { ConsequenceMemoryState } from './consequenceMemory';
import type { MetaCognitiveState } from './metaCognitive';

// ─── tuning constants ───────────────────────────────────────────

/** Per-event natural decay applied to every vector's persistenceWeight. */
export const VECTOR_BASE_DECAY = 0.05;
/** Max per-event change to a vector's persistenceWeight (after reinforcement). */
export const MAX_VECTOR_DELTA = 1.0;
/** EWMA alpha for continuity metrics. */
export const CONTINUITY_EWMA = 0.15;
/** Civilization state hysteresis ticks. */
export const CIVILIZATION_HYSTERESIS_TICKS = 4;
/** Significant-conflict threshold. */
export const CONFLICT_INTENSITY_THRESHOLD = 4;
/** Drift event-history threshold. */
export const DRIFT_OBSERVATION_THRESHOLD = 0.5;
/** Lineage mutation spawn threshold (persistenceWeight). */
export const MUTATION_SPAWN_THRESHOLD = 8;
/** Min ticks between mutations of the same lineage chain (debounce). */
export const MUTATION_COOLDOWN_TICKS = 12;
/** MissionBias clamp. */
export const MISSION_BIAS_CLAMP = 0.20;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function clamp01(n: number): number { return clamp(0, 1, n); }
function clampBias(n: number): number { return clamp(-MISSION_BIAS_CLAMP, MISSION_BIAS_CLAMP, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── per-verb directional reinforcement table ──────────────────

const VERB_REINFORCEMENT: Record<string, Partial<Record<StrategicDirection, number>>> = {
  observe:   { integrative:  0.3, conservative: 0.1 },
  notice:    { integrative:  0.4, conservative: 0.1 },
  consider:  { integrative:  0.5, optimizing:  0.2 },
  restrain:  { protective:   0.5, conservative: 0.4 },
  permit:    { exploratory:  0.4, integrative: 0.2 },
  prepare:   { exploratory:  0.5, optimizing:  0.2 },
  draft:     { exploratory:  0.7, optimizing:  0.3 },
  review:    { optimizing:   0.6, protective:  0.3, integrative: 0.2 },
  revise:    { optimizing:   0.7, integrative: 0.3 },
  approve:   { protective:   0.5, optimizing:  0.4, integrative: 0.2 },
  propose:   { exploratory:  0.7, optimizing:  0.2 },
  rest:      { conservative: 0.7, protective:  0.4 },
  defer:     { protective:   0.5, conservative: 0.5, integrative: 0.2 },
};

function reinforcementForDirective(directiveName: string): Partial<Record<StrategicDirection, number>> {
  if (directiveName.endsWith('-refused')) {
    const base = directiveName.replace('-refused', '');
    const found = VERB_REINFORCEMENT[base] ?? {};
    // refusals contribute small reinforcement to protective (the system held back)
    return { ...found, protective: (found.protective ?? 0) + 0.2 };
  }
  return VERB_REINFORCEMENT[directiveName] ?? {};
}

// ─── activation-state classifier with hysteresis ───────────────

function classifyActivation(weight: number, prev: MissionActivationState): MissionActivationState {
  // bands overlap by 0.5 so transitions don't oscillate
  if (weight >= 7) return 'active';
  if (prev === 'active' && weight >= 6.5) return 'active';
  if (weight >= 4) return prev === 'lineage-stored' ? 'forming' : (prev === 'active' ? 'fading' : 'forming');
  if (prev === 'forming' && weight >= 3.5) return 'forming';
  if (weight >= 1.5) return prev === 'forming' ? 'forming' : prev === 'active' ? 'fading' : 'dormant';
  return prev === 'fading' || prev === 'dormant' ? 'dormant' : 'fading';
}

// ─── per-vector update ─────────────────────────────────────────

interface ContextSignal {
  resourceAggregate: number;     // 0..100
  collapseSeverity: number;      // 0..3
  maxContradiction: number;      // 0..10
  envState: string;
  envThreat: number;             // 0..10
  reliability: number;           // 0..10
}

function updateVector(
  v: MissionVector, reinforcement: number, ctx: ContextSignal,
  at: number, tick: number,
): MissionVector {
  // Decay always, then add reinforcement (capped).
  const decay = v.degradationRate;
  let delta = reinforcement - decay;
  if (delta >  MAX_VECTOR_DELTA) delta =  MAX_VECTOR_DELTA;
  if (delta < -MAX_VECTOR_DELTA) delta = -MAX_VECTOR_DELTA;
  const newWeight = round1(clamp10(v.persistenceWeight + delta));

  const historicalReinforcement = reinforcement > 0
    ? v.historicalReinforcement + 1
    : v.historicalReinforcement;

  // EWMA-update continuityAnchor / abandonmentResistance / mutationTolerance
  // from sustained reinforcement + context. Anchors grow when reinforcement
  // is consistent; abandonment resistance grows under hostile conditions.
  const hostility = (ctx.collapseSeverity + ctx.envThreat / 5 + ctx.maxContradiction / 10) / 3;
  const continuityAnchor = round1(clamp10(
    v.continuityAnchor * 0.95 + (reinforcement > 0 ? 0.5 : 0) + hostility * 0.05,
  ));
  const abandonmentResistance = round1(clamp10(
    v.abandonmentResistance * 0.94 + hostility * 0.3 + (reinforcement > 0 ? 0.1 : 0),
  ));
  const mutationTolerance = round1(clamp10(
    v.mutationTolerance * 0.97
      + (reinforcement > 0.2 ? 0.2 : 0)
      + (ctx.envState === 'unstable' || ctx.envState === 'collapse-prone' ? 0.3 : 0)
      + (hostility > 0.4 ? 0.15 : 0),
  ));

  const activationState = classifyActivation(newWeight, v.activationState);

  let reinforcementHistory = v.reinforcementHistory;
  if (Math.abs(reinforcement) >= 0.2) {
    reinforcementHistory = [...reinforcementHistory, {
      at, tick, reinforcement: round2(reinforcement),
      persistenceWeight: newWeight,
    }];
  }

  return {
    ...v,
    persistenceWeight: newWeight,
    historicalReinforcement,
    continuityAnchor,
    abandonmentResistance,
    mutationTolerance,
    activationState,
    lastReinforcedAt: reinforcement > 0 ? at : v.lastReinforcedAt,
    lastReinforcedTick: reinforcement > 0 ? tick : v.lastReinforcedTick,
    reinforcementHistory,
  };
}

// ─── mutation spawning ─────────────────────────────────────────

function shouldSpawnMutation(v: MissionVector, ctx: ContextSignal, tick: number): boolean {
  if (v.persistenceWeight < MUTATION_SPAWN_THRESHOLD) return false;
  if (v.activationState !== 'active') return false;
  if (v.mutationTolerance < 6) return false;
  if (tick - v.lastReinforcedTick > 5) return false;
  // hostile or unusual context provides the mutational pressure
  const hostility = (ctx.collapseSeverity + ctx.maxContradiction / 5 + ctx.envThreat / 5) / 3;
  if (hostility < 0.6) return false;
  return true;
}

function spawnMutation(
  parent: MissionVector, ctx: ContextSignal, at: number, tick: number,
): { child: MissionVector; lineageEvent: LineageEvent } {
  const childId = `vec-mut-${parent.strategicDirection}-${tick}`;
  // Mutation inherits half of parent's persistenceWeight + reduced degradation
  const inheritedWeight = round1(parent.persistenceWeight * 0.5);
  // Mutation distance scaled by context hostility
  const mutationDistance = round1(clamp10(
    (ctx.collapseSeverity + ctx.maxContradiction / 2 + ctx.envThreat / 2) / 1.5,
  ));
  const child: MissionVector = {
    id: childId,
    originatingEpoch: tick,
    parentVectorId: parent.id,
    strategicDirection: parent.strategicDirection,
    persistenceWeight: inheritedWeight,
    historicalReinforcement: 0,
    degradationRate: round2(parent.degradationRate * 1.1),
    continuityAnchor: round1(parent.continuityAnchor * 0.7),
    abandonmentResistance: round1(parent.abandonmentResistance * 0.6),
    mutationTolerance: round1(clamp10(parent.mutationTolerance * 0.9)),
    lineageConnections: [parent.id, ...parent.lineageConnections.slice(0, 5)],
    activationState: 'forming',
    lastReinforcedAt: at,
    lastReinforcedTick: tick,
    reinforcementHistory: [],
  };
  const continuityPreserved = round1(parent.continuityAnchor * 0.7);
  const civilizationDeviation = round1(clamp10(mutationDistance * 0.8));
  const inheritanceStrength = round1(clamp10(10 - mutationDistance * 0.6));
  const lineageEvent: LineageEvent = {
    at, tick, kind: 'mutation',
    fromVectorId: parent.id, toVectorId: childId,
    mutationDistance, inheritanceStrength,
    continuityPreserved, civilizationDeviation,
  };
  return { child, lineageEvent };
}

// ─── continuity metric computation ────────────────────────────

function computeContinuityStrength(vectors: MissionVector[]): number {
  // Weighted sum of persistenceWeights, activation-weighted.
  const totalActive = vectors
    .filter((v) => v.activationState === 'active' || v.activationState === 'forming')
    .reduce((a, v) => a + v.persistenceWeight, 0);
  // Normalize to 0..10. Max ~ 35 (5 vectors × 7-ish weight) → divisor 3.5.
  return round1(clamp10(totalActive / 3.5));
}

function computeMissionIntegrity(vectors: MissionVector[], directiveName: string): number {
  // How well current activity aligns with active vectors.
  const reinforcement = reinforcementForDirective(directiveName);
  const activeVectors = vectors.filter((v) =>
    v.activationState === 'active' || v.activationState === 'forming');
  if (activeVectors.length === 0) return 5;
  let alignment = 0, totalWeight = 0;
  for (const v of activeVectors) {
    const dirReinforcement = reinforcement[v.strategicDirection] ?? 0;
    alignment += v.persistenceWeight * dirReinforcement;
    totalWeight += v.persistenceWeight;
  }
  if (totalWeight === 0) return 5;
  // alignment ranges roughly 0..0.7 per weight; scale to 0..10.
  return round1(clamp10((alignment / totalWeight) * 14));
}

function computeExistentialDrift(
  vectors: MissionVector[], ecology: InternalEcologyState | null,
  prevDrift: number,
): { drift: number; driver: DriftObservation['driver'] | null } {
  // Combine: switching frequency (recent dominance shifts in ecology),
  // contradiction with historical vectors (low integrity), volatility,
  // continuity breaks (vectors fading).
  const ecologyVolatility = ecology?.volatilityField ?? 0;
  const switchingFreq = ecology
    ? Math.min(5, ecology.dominanceShifts.slice(-10).length) / 5
    : 0;
  const fadingFraction = vectors.filter((v) =>
    v.activationState === 'fading' || v.activationState === 'dormant').length / vectors.length;
  // Composite (weighted)
  const candidate = round1(clamp10(
    ecologyVolatility * 0.25
    + switchingFreq * 5 * 0.20
    + fadingFraction * 10 * 0.30
    + (ecology?.volatilityField ?? 0) * 0.15
  ));
  // EWMA smoothing so drift accumulates rather than jumps.
  const drift = round1(clamp10(prevDrift * (1 - CONTINUITY_EWMA) + candidate * CONTINUITY_EWMA));
  // Identify dominant driver.
  let driver: DriftObservation['driver'] | null = null;
  if (Math.abs(drift - prevDrift) >= 0.2) {
    if (fadingFraction > 0.4) driver = 'continuity-break';
    else if (switchingFreq > 0.4) driver = 'switching';
    else if (ecologyVolatility > 5) driver = 'volatility';
    else driver = 'doctrine-deviation';
  }
  return { drift, driver };
}

function computeLineageStability(vectors: MissionVector[]): number {
  if (vectors.length === 0) return 5;
  // depth = max chain depth via parent traversal
  const byId = new Map(vectors.map((v) => [v.id, v]));
  let maxDepth = 0;
  for (const v of vectors) {
    let depth = 0;
    let cur: MissionVector | undefined = v;
    while (cur?.parentVectorId) {
      depth += 1;
      const parent: MissionVector | undefined = byId.get(cur.parentVectorId);
      if (!parent) break;
      cur = parent;
      if (depth > 8) break; // safety
    }
    if (depth > maxDepth) maxDepth = depth;
  }
  // average continuityAnchor of active vectors
  const active = vectors.filter((v) => v.activationState === 'active' || v.activationState === 'forming');
  const avgAnchor = active.length === 0
    ? 5
    : active.reduce((a, v) => a + v.continuityAnchor, 0) / active.length;
  return round1(clamp10(maxDepth * 1.2 + avgAnchor * 0.6));
}

function computeLongHorizonCoherence(
  vectors: MissionVector[], reliability: number,
): number {
  // Weighted by historical reinforcement + reliability.
  const totalReinforcement = vectors.reduce((a, v) => a + v.historicalReinforcement, 0);
  const reinforcementFactor = Math.min(10, totalReinforcement / 10);
  return round1(clamp10(reinforcementFactor * 0.5 + reliability * 0.5));
}

function computeAdaptationContinuity(
  vectors: MissionVector[], prev: number, ecologyState: string,
): number {
  // Continuity preserved during adaptation (ecology shifts).
  const adaptiveEcologyStates = ['exploratory', 'over-optimized', 'unstable'];
  const isAdapting = adaptiveEcologyStates.includes(ecologyState);
  const activeCount = vectors.filter((v) => v.activationState === 'active' || v.activationState === 'forming').length;
  const baselineContinuity = activeCount * 1.5;
  const candidate = round1(clamp10(
    baselineContinuity + (isAdapting ? -1 : 1),
  ));
  return round1(clamp10(prev * (1 - CONTINUITY_EWMA) + candidate * CONTINUITY_EWMA));
}

function computeStrategicPersistence(vectors: MissionVector[], civilizationAge: number): number {
  if (vectors.length === 0 || civilizationAge === 0) return 0;
  // Average vector age (tick-since-origin) weighted by activation.
  let totalAge = 0, totalWeight = 0;
  for (const v of vectors) {
    if (v.activationState === 'lineage-stored' || v.activationState === 'dormant') continue;
    const age = Math.max(0, civilizationAge - v.originatingEpoch);
    totalAge += age * v.persistenceWeight;
    totalWeight += v.persistenceWeight;
  }
  if (totalWeight === 0) return 0;
  const avgAge = totalAge / totalWeight;
  // Scale: average age of ~50 events → ~7/10.
  return round1(clamp10(avgAge * 0.15));
}

function computeMissionPressure(integrity: number, drift: number, momentum: number): number {
  // Pressure rises when integrity is low, drift is high, momentum is negative.
  return round1(clamp10(
    (10 - integrity) * 0.5
    + drift * 0.3
    + Math.max(0, -momentum * 2) * 0.2,
  ));
}

// ─── civilization state classification ─────────────────────────

function classifyCivilization(s: {
  continuityStrength: number; missionIntegrity: number;
  existentialDrift: number; lineageStability: number;
  longHorizonCoherence: number; adaptationContinuity: number;
  vectors: MissionVector[];
}): CivilizationState {
  const activeVectors = s.vectors.filter((v) => v.activationState === 'active').length;
  const mutatedVectors = s.vectors.filter((v) => v.parentVectorId !== null).length;
  const fadingFraction = s.vectors.filter((v) => v.activationState === 'fading' || v.activationState === 'dormant').length / Math.max(1, s.vectors.length);

  if (s.continuityStrength < 2.5 && activeVectors === 0) return 'mission-exhausted';
  if (s.existentialDrift >= 7) return 'fractured';
  if (s.existentialDrift >= 5) return 'drifting';
  if (mutatedVectors >= 3 && mutatedVectors / Math.max(1, s.vectors.length) > 0.5) return 'over-mutated';
  if (s.continuityStrength < 4 || s.missionIntegrity < 4) return 'continuity-fragile';
  if (s.lineageStability >= 7 && mutatedVectors >= 1) return 'lineage-preserved';
  if (s.adaptationContinuity >= 7 && s.existentialDrift < 4) return 'adaptive-stable';
  return 'coherent';
}

function transitionCivState(
  prev: CivilizationState, prevTicks: number, candidate: CivilizationState,
): { state: CivilizationState; ticks: number } {
  if (candidate === prev) return { state: prev, ticks: prevTicks + 1 };
  if (prevTicks < CIVILIZATION_HYSTERESIS_TICKS) {
    return { state: prev, ticks: prevTicks + 1 };
  }
  return { state: candidate, ticks: 1 };
}

// ─── conflict detection ───────────────────────────────────────

function detectConflicts(
  prev: ContinuityConflict[], integrity: number, drift: number,
  ecology: InternalEcologyState | null, resource: ResourceEconomyState | null,
  at: number, tick: number,
): ContinuityConflict[] {
  const conflicts: ContinuityConflict[] = [];
  if (drift >= 5 && integrity < 6) {
    conflicts.push({
      at, tick, kind: 'continuity',
      intensity: round1((drift + (10 - integrity)) / 2),
      description: `existential drift ${drift.toFixed(1)} against integrity ${integrity.toFixed(1)}`,
    });
  }
  if (ecology?.state === 'unstable' && integrity > 6) {
    conflicts.push({
      at, tick, kind: 'adaptation',
      intensity: 6,
      description: `ecology unstable while mission integrity holds — adaptation cost`,
    });
  }
  if (resource?.collapseState && resource.collapseState !== 'healthy' && integrity > 6) {
    conflicts.push({
      at, tick, kind: 'survival-tradeoff',
      intensity: round1(5 + (resource.collapseState === 'depleted' ? 2 : 1)),
      description: `resource ${resource.collapseState} threatens persistence`,
    });
  }
  return [...prev, ...conflicts.filter((c) => c.intensity >= CONFLICT_INTENSITY_THRESHOLD)];
}

// ─── bias output ───────────────────────────────────────────────

export interface MissionBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

export function computeMissionBias(state: MissionContinuityState): MissionBias {
  // Drift restricts, integrity permits. Mission pressure increases conservation.
  const driftFactor = (state.existentialDrift - 3) / 7;       // -0.43..+1
  const integrityFactor = (state.missionIntegrity - 5) / 5;   // -1..+1
  const pressureFactor = state.missionPressure / 10;          // 0..1
  const momentumFactor = state.continuityMomentum;            // signed

  return {
    cognitionThroughput:  clampBias(round2(-driftFactor * 0.15 + integrityFactor * 0.05 - pressureFactor * 0.10 + momentumFactor * 0.05)),
    escalationPermission: clampBias(round2(-driftFactor * 0.20 + integrityFactor * 0.10 - pressureFactor * 0.10)),
    explorationIntensity: clampBias(round2(-driftFactor * 0.15 + integrityFactor * 0.05 - pressureFactor * 0.10)),
    deferAcceptance:      clampBias(round2(+driftFactor * 0.15 + pressureFactor * 0.15 - momentumFactor * 0.05)),
    recoveryWeighting:    clampBias(round2(+driftFactor * 0.10 + pressureFactor * 0.10)),
    burstTolerance:       clampBias(round2(-driftFactor * 0.15 - pressureFactor * 0.10 + integrityFactor * 0.05)),
  };
}

export function applyMissionBias<G extends MissionBias>(gradients: G, bias: MissionBias): G {
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

/** Mission pressure contribution for the recursive simulator. 0..0.2 —
 *  rises when civilization is mission-exhausted / fractured / over-mutated. */
export function missionPressureContribution(state: MissionContinuityState): number {
  switch (state.state) {
    case 'mission-exhausted':
    case 'fractured':
      return 0.2;
    case 'continuity-fragile':
    case 'over-mutated':
      return 0.15;
    case 'drifting':
      return 0.10;
    default:
      // small pressure proportional to drift score even in healthy states
      return state.existentialDrift > 4 ? round2((state.existentialDrift - 4) * 0.03) : 0;
  }
}

// ─── main update ───────────────────────────────────────────────

export interface MissionContinuitySignal {
  at: number;
  tick: number;
  directiveName: string;
  ecology: InternalEcologyState | null;
  resource: ResourceEconomyState | null;
  environment: EnvironmentMemoryState | null;
  contradiction: ContradictionMemoryState | null;
  consequence: ConsequenceMemoryState | null;
  meta: MetaCognitiveState | null;
}

export function updateMissionContinuity(
  state: MissionContinuityState, signal: MissionContinuitySignal,
): MissionContinuityState {
  const reinforcement = reinforcementForDirective(signal.directiveName);

  const ctx: ContextSignal = {
    resourceAggregate: signal.resource?.reserveAggregate ?? 56,
    collapseSeverity:
      signal.resource?.collapseState === 'liquidity-collapse' ? 3 :
      signal.resource?.collapseState === 'depleted' ? 2.5 :
      signal.resource?.collapseState === 'contradiction-fragile' ? 2 :
      signal.resource?.collapseState === 'starvation-risk' ? 2 :
      signal.resource?.collapseState === 'recovery-locked' ? 1.5 :
      signal.resource?.collapseState === 'overextended' ? 1 : 0,
    maxContradiction: signal.contradiction
      ? signal.contradiction.pairs.reduce((m, p) => Math.max(m, p.tensionScore), 0)
      : 0,
    envState: signal.environment?.state ?? 'stable',
    envThreat: signal.environment?.levels.threatPressure ?? 0,
    reliability: signal.meta?.cumulativeReliabilityScore ?? 7,
  };

  // 1. update each existing vector.
  let updatedVectors = state.vectors.map((v) => {
    const dirReinforcement = reinforcement[v.strategicDirection] ?? 0;
    return updateVector(v, dirReinforcement, ctx, signal.at, signal.tick);
  });

  // 2. check for mutation spawning. At most one new mutation per event.
  const newLineageEvents: LineageEvent[] = [];
  const dueForMutation = updatedVectors.find((v) => shouldSpawnMutation(v, ctx, signal.tick));
  if (dueForMutation) {
    // cooldown: don't mutate if a recent lineage event involved this vector
    const recentLineage = state.lineageEvents.slice(-3).find((e) =>
      (e.fromVectorId === dueForMutation.id || e.toVectorId === dueForMutation.id)
      && signal.tick - e.tick < MUTATION_COOLDOWN_TICKS,
    );
    if (!recentLineage) {
      const { child, lineageEvent } = spawnMutation(dueForMutation, ctx, signal.at, signal.tick);
      updatedVectors = [...updatedVectors, child];
      newLineageEvents.push(lineageEvent);
    }
  }

  // 3. compute continuity metrics.
  const continuityStrength = computeContinuityStrength(updatedVectors);
  const missionIntegrity = computeMissionIntegrity(updatedVectors, signal.directiveName);
  const { drift: existentialDrift, driver: driftDriver } =
    computeExistentialDrift(updatedVectors, signal.ecology, state.existentialDrift);
  const lineageStability = computeLineageStability(updatedVectors);
  const longHorizonCoherence = computeLongHorizonCoherence(updatedVectors, ctx.reliability);
  const adaptationContinuity = computeAdaptationContinuity(
    updatedVectors, state.adaptationContinuity, signal.ecology?.state ?? 'balanced',
  );
  const civilizationAge = state.civilizationAge + 1;
  const strategicPersistence = computeStrategicPersistence(updatedVectors, civilizationAge);
  // momentum = EWMA-signed delta of continuityStrength
  const rawMomentum = continuityStrength - state.continuityStrength;
  const continuityMomentum = round2(state.continuityMomentum * (1 - CONTINUITY_EWMA) + rawMomentum * CONTINUITY_EWMA);
  const missionPressure = computeMissionPressure(missionIntegrity, existentialDrift, continuityMomentum);

  // 4. drift observation history.
  let driftHistory = state.driftHistory;
  if (driftDriver && Math.abs(existentialDrift - state.existentialDrift) >= DRIFT_OBSERVATION_THRESHOLD) {
    driftHistory = [...driftHistory, {
      at: signal.at, tick: signal.tick,
      existentialDrift, driver: driftDriver,
    }];
  }

  // 5. conflict detection.
  const recentConflicts = detectConflicts(
    state.recentConflicts, missionIntegrity, existentialDrift,
    signal.ecology, signal.resource, signal.at, signal.tick,
  );

  // 6. civilization state classification.
  const candidate = classifyCivilization({
    continuityStrength, missionIntegrity, existentialDrift,
    lineageStability, longHorizonCoherence,
    adaptationContinuity, vectors: updatedVectors,
  });
  const { state: civState, ticks } = transitionCivState(
    state.state, state.statePersistenceTicks, candidate,
  );

  return {
    civilizationAge,
    continuityStrength,
    missionIntegrity,
    existentialDrift,
    lineageStability,
    longHorizonCoherence,
    adaptationContinuity,
    strategicPersistence,
    missionPressure,
    continuityMomentum,
    vectors: updatedVectors,
    driftHistory,
    lineageEvents: [...state.lineageEvents, ...newLineageEvents],
    recentConflicts,
    state: civState,
    statePersistenceTicks: ticks,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };
}
