/**
 * RESOURCE ECONOMY ENGINE (Wave 38)
 *
 * Deterministic operational metabolism. Every cognitive event:
 *
 *   1. computes a base verb cost from the per-verb resource table
 *   2. scales every cost by a state-context multiplier composed of
 *      ecology state + governance zone + contradiction tension +
 *      current scarcity. Costs (negative deltas) are AMPLIFIED;
 *      restorations (positive deltas) are DIMINISHED.
 *   3. applies passive homeostatic drift toward each resource's
 *      baseline, biased by ecological dominance (asymmetric recovery)
 *   4. updates per-resource flow (last delta, EWMA emaRate, burn /
 *      restore rates)
 *   5. classifies into one of eight collapse states
 *   6. computes per-species allocation (desire / actual / scarcity
 *      stress / hoarding) + cross-species allocation conflicts
 *   7. emits a ScarcityBias struct (gradient deltas, each bounded
 *      ±0.25) governance will compose alongside ecology bias
 *
 * No static costs. Same draft event may cost 2 cognitiveEnergy in
 * a stable state and 6+ in a depleted state. Continuous nonlinear
 * degradation only.
 */

import type {
  ResourceEconomyState, ResourceLevels, ResourceId, ResourceFlow,
  ResourceObservation, CollapseState, SpeciesAllocation,
  AllocationConflict, EcologySpeciesId, ExhaustionForecast,
} from './resourceEconomyMemory';
import {
  ALL_RESOURCES, RESOURCE_MAX, RESOURCE_BASELINES,
} from './resourceEconomyMemory';
import type { InternalEcologyState, SpeciesId } from './internalEcologyMemory';
import type { CognitiveGovernanceState } from './cognitiveGovernance';
import type { ContradictionMemoryState } from './contradictionMemory';

// ─── tuning constants ───────────────────────────────────────────

export const FLOW_EWMA_ALPHA = 0.2;
export const OBSERVATION_DELTA_THRESHOLD = 0.5;
export const SCARCITY_BIAS_CLAMP = 0.25;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp100(n: number): number { return clamp(0, RESOURCE_MAX, n); }
function clamp01(n: number): number { return clamp(0, 1, n); }
function clampBias(n: number): number { return clamp(-SCARCITY_BIAS_CLAMP, SCARCITY_BIAS_CLAMP, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── base verb cost table ──────────────────────────────────────
//
// All values are PRE-multiplier base costs. Negative = consume,
// positive = restore. Resources not listed have 0 base delta for
// that verb.

type ResourceDelta = Partial<Record<ResourceId, number>>;

const VERB_RESOURCE_COSTS: Record<string, ResourceDelta> = {
  observe:   { cognitiveEnergy: -1.0, executionLiquidity: -0.2 },
  notice:    { cognitiveEnergy: -1.0, coherenceReserve: +0.3 },
  consider:  { cognitiveEnergy: -1.5, coherenceReserve: +0.5, contradictionCapacity: +0.2 },
  restrain:  { cognitiveEnergy: -0.5, recoveryReserve: +0.5, coherenceReserve: +0.7 },
  permit:    { cognitiveEnergy: -2.0, executionLiquidity: -1.0, explorationCapital: -0.5 },
  prepare:   { cognitiveEnergy: -2.0, executionLiquidity: -1.5 },
  draft:     { cognitiveEnergy: -4.0, executionLiquidity: -3.0, contradictionCapacity: -1.2, explorationCapital: -1.5 },
  review:    { cognitiveEnergy: -2.0, coherenceReserve: +1.0, contradictionCapacity: +0.5 },
  revise:    { cognitiveEnergy: -3.0, coherenceReserve: -0.6, explorationCapital: -1.0, executionLiquidity: -1.0 },
  approve:   { cognitiveEnergy: -1.5, strategicStability: +1.5, coherenceReserve: +1.0 },
  propose:   { cognitiveEnergy: -3.0, executionLiquidity: -2.0, explorationCapital: -2.0, strategicStability: -0.5 },
  rest:      { cognitiveEnergy: +3.0, recoveryReserve: +4.0, coherenceReserve: +1.5, contradictionCapacity: +1.0 },
  defer:     { recoveryReserve: +1.5, strategicStability: +2.0, coherenceReserve: +0.5, executionLiquidity: -0.3 },
};

/** Refusals still cost something — half the absolute cost on
 *  consumption only; restorations are zero (a refused verb didn't
 *  actually rest / defer / approve). */
function baseCostsForDirective(directiveName: string): ResourceDelta {
  if (directiveName.endsWith('-refused')) {
    const base = directiveName.replace('-refused', '');
    const found = VERB_RESOURCE_COSTS[base] ?? {};
    const out: ResourceDelta = {};
    for (const [k, v] of Object.entries(found) as [ResourceId, number][]) {
      out[k] = v < 0 ? round2(v * 0.5) : 0;
    }
    return out;
  }
  return VERB_RESOURCE_COSTS[directiveName] ?? {};
}

// ─── state-dependent cost multiplier ───────────────────────────

export interface CostMultiplierInputs {
  ecology: InternalEcologyState | null;
  governance: CognitiveGovernanceState | null;
  contradiction: ContradictionMemoryState | null;
  levels: ResourceLevels;
}

/** A composite scalar 1.0..2.0+ that amplifies consumption when
 *  ecology / governance / contradiction / scarcity signal stress. */
export function computeCostMultiplier(inputs: CostMultiplierInputs): number {
  let m = 1.0;

  // Ecology state.
  switch (inputs.ecology?.state) {
    case 'exhausted':      m *= 1.55; break;
    case 'unstable':       m *= 1.30; break;
    case 'over-optimized': m *= 1.15; break;
    case 'defensive':      m *= 1.10; break;
    case 'exploratory':    m *= 1.05; break;
    default: break;
  }

  // Governance zone.
  switch (inputs.governance?.zone) {
    case 'suspended':  m *= 1.50; break;
    case 'restricted': m *= 1.25; break;
    case 'watchful':   m *= 1.10; break;
    default: break;
  }

  // Contradiction tension.
  const maxTension = inputs.contradiction
    ? inputs.contradiction.pairs.reduce((mx, p) => Math.max(mx, p.tensionScore), 0)
    : 0;
  if (maxTension > 7) m *= 1.15;
  else if (maxTension > 5) m *= 1.08;

  // Current scarcity — spending what you don't have costs more.
  const avg = ALL_RESOURCES.reduce((a, r) => a + inputs.levels[r], 0) / ALL_RESOURCES.length;
  if (avg < 30) m *= 1.30;
  else if (avg < 45) m *= 1.15;

  return round2(m);
}

/** Apply multiplier asymmetrically — costs (negative) amplified,
 *  restorations (positive) diminished. */
function applyMultiplier(delta: number, multiplier: number): number {
  if (delta < 0) return round2(delta * multiplier);
  if (multiplier === 0) return delta;
  return round2(delta / multiplier);
}

// ─── ecology-driven asymmetric drift ───────────────────────────

/** Per-resource drift bias from ecological dominance. Each species
 *  protects / restores a different resource preferentially. */
function ecologyDriftBias(
  resource: ResourceId, ecology: InternalEcologyState | null,
): number {
  if (!ecology) return 0;
  // Influence of each species (0..1 weight, ~0.25 baseline).
  const influence = (id: SpeciesId): number =>
    (ecology.species.find((s) => s.id === id)?.influenceWeight ?? 0.25) - 0.25;
  switch (resource) {
    case 'coherenceReserve':      return  influence('guardian')    * 0.8;
    case 'contradictionCapacity': return  influence('guardian')    * 0.5;
    case 'strategicStability':    return (influence('guardian')    + influence('conservator')) * 0.4;
    case 'recoveryReserve':       return  influence('conservator') * 0.9;
    case 'cognitiveEnergy':       return  influence('conservator') * 0.4 - influence('explorer') * 0.3;
    case 'explorationCapital':    return  influence('explorer')    * 0.8;
    case 'executionLiquidity':    return  influence('optimizer')   * 0.8;
    default: return 0;
  }
}

/** Homeostatic drift toward baseline per event. Slow when far
 *  from baseline — recovery is asymmetric and time-dependent. */
function homeostaticDrift(level: number, baseline: number): number {
  const gap = baseline - level;
  // 4% of the gap per event, dampened when severely depleted (recovery is harder when broken)
  const dampener = level < 20 ? 0.5 : level < 40 ? 0.75 : 1;
  return round2(gap * 0.04 * dampener);
}

// ─── per-resource update ───────────────────────────────────────

function updateFlow(prev: ResourceFlow, delta: number): ResourceFlow {
  const ema = prev.emaRate * (1 - FLOW_EWMA_ALPHA) + delta * FLOW_EWMA_ALPHA;
  const burnSample = delta < 0 ? -delta : 0;
  const restoreSample = delta > 0 ? delta : 0;
  return {
    lastDelta: round2(delta),
    emaRate: round2(ema),
    burnRate: round2(prev.burnRate * (1 - FLOW_EWMA_ALPHA) + burnSample * FLOW_EWMA_ALPHA),
    restoreRate: round2(prev.restoreRate * (1 - FLOW_EWMA_ALPHA) + restoreSample * FLOW_EWMA_ALPHA),
  };
}

// ─── collapse classification ───────────────────────────────────

export function classifyCollapse(levels: ResourceLevels): CollapseState {
  const low = (n: number) => n < 25;
  const critical = (n: number) => n < 10;

  if (critical(levels.cognitiveEnergy) && critical(levels.executionLiquidity)) return 'liquidity-collapse';
  if (critical(levels.cognitiveEnergy)) return 'depleted';
  if (critical(levels.contradictionCapacity)) return 'contradiction-fragile';
  if (critical(levels.recoveryReserve)) return 'recovery-locked';
  if (critical(levels.explorationCapital)) return 'exploration-bankrupt';
  if (low(levels.strategicStability) && low(levels.coherenceReserve)) return 'starvation-risk';
  const lowCount = ALL_RESOURCES.filter((r) => low(levels[r])).length;
  if (lowCount >= 3) return 'overextended';
  return 'healthy';
}

// ─── species allocation ────────────────────────────────────────

/** Resource preferences per species (0..1 weights). */
const SPECIES_DESIRE: Record<EcologySpeciesId, Partial<Record<ResourceId, number>>> = {
  explorer:    { explorationCapital: 0.7, executionLiquidity: 0.4, cognitiveEnergy: 0.3 },
  guardian:    { coherenceReserve:   0.7, strategicStability:  0.6, contradictionCapacity: 0.5 },
  optimizer:   { executionLiquidity: 0.7, cognitiveEnergy:     0.4, contradictionCapacity: 0.3 },
  conservator: { recoveryReserve:    0.7, cognitiveEnergy:     0.4, coherenceReserve:     0.4 },
};

function speciesAllocationFor(
  speciesId: EcologySpeciesId, intensity: number, levels: ResourceLevels,
): SpeciesAllocation {
  const desires = SPECIES_DESIRE[speciesId];
  let weightSum = 0, desiredSum = 0, actualSum = 0;
  // Desired level scales with intensity (a more active species "wants" more)
  const desiredTarget = 50 + intensity * 4;  // intensity 10 → wants 90
  for (const [r, w] of Object.entries(desires) as [ResourceId, number][]) {
    weightSum += w;
    desiredSum += w * desiredTarget;
    actualSum += w * levels[r];
  }
  const desiredScore = weightSum === 0 ? 50 : round1(desiredSum / weightSum);
  const actualScore = weightSum === 0 ? 50 : round1(actualSum / weightSum);
  const scarcityStress = round1(Math.max(0, desiredScore - actualScore));
  // Hoarding: when actual > desired AND species intensity is high, pressure to protect rises.
  const hoardingPressure = actualScore > desiredScore && intensity >= 6
    ? round1((actualScore - desiredScore) * (intensity / 10) * 0.2)
    : 0;
  return {
    speciesId,
    desiredScore, actualScore, scarcityStress, hoardingPressure,
  };
}

function computeAllocationConflicts(
  allocations: SpeciesAllocation[], ecology: InternalEcologyState | null, levels: ResourceLevels,
): AllocationConflict[] {
  if (!ecology) return [];
  const conflicts: AllocationConflict[] = [];
  // For each shared resource where two species both desire it and the resource is scarce, log conflict.
  const ids: EcologySpeciesId[] = ['explorer', 'conservator', 'optimizer', 'guardian'];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const aDesires = SPECIES_DESIRE[a];
      const bDesires = SPECIES_DESIRE[b];
      for (const [r, aw] of Object.entries(aDesires) as [ResourceId, number][]) {
        const bw = bDesires[r];
        if (!bw) continue;
        // Both want this resource. Conflict score = weights × scarcity factor.
        const level = levels[r];
        if (level >= 50) continue;     // plenty — no conflict
        const scarcityFactor = (50 - level) / 50;  // 0..1
        const score = aw * bw * scarcityFactor * 10;
        if (score >= 1.0) {
          conflicts.push({ speciesA: a, speciesB: b, resource: r, conflictScore: round1(score) });
        }
      }
    }
  }
  // Sort by conflict descending, keep top 4.
  return conflicts.sort((x, y) => y.conflictScore - x.conflictScore).slice(0, 4);
}

// ─── scarcity bias on governance gradients ────────────────────

export interface ScarcityBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

/** scarcityFactor(level) — 0 when level≥50, scales linearly to 1 at level=0. */
function scarcityFactor(level: number): number {
  return clamp01((50 - level) / 50);
}

export function computeScarcityBias(levels: ResourceLevels): ScarcityBias {
  const ce  = scarcityFactor(levels.cognitiveEnergy);
  const co  = scarcityFactor(levels.coherenceReserve);
  const rec = scarcityFactor(levels.recoveryReserve);
  const exp = scarcityFactor(levels.explorationCapital);
  const ss  = scarcityFactor(levels.strategicStability);
  const cc  = scarcityFactor(levels.contradictionCapacity);
  const el  = scarcityFactor(levels.executionLiquidity);

  return {
    cognitionThroughput:  clampBias(round2(-ce * 0.2  - el * 0.15)),
    escalationPermission: clampBias(round2(-cc * 0.25 - ss * 0.15)),
    explorationIntensity: clampBias(round2(-exp * 0.30 - ce * 0.1)),
    deferAcceptance:      clampBias(round2(+ce * 0.15 + ss * 0.2 + el * 0.15)),
    recoveryWeighting:    clampBias(round2(+ce * 0.20 + rec * 0.15 + co * 0.15)),
    burstTolerance:       clampBias(round2(-ce * 0.20 - el * 0.20)),
  };
}

/** Apply scarcity bias to a gradients struct, clamping back to [0,1]. */
export function applyScarcityBias<G extends ScarcityBias>(
  gradients: G, bias: ScarcityBias,
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

/** Resource economy additional pressure for the recursive simulator
 *  weighting. 0..0.2 — small but increases as scarcity worsens. */
export function scarcityPressureContribution(state: ResourceEconomyState): number {
  switch (state.collapseState) {
    case 'liquidity-collapse':
    case 'depleted':
      return 0.2;
    case 'contradiction-fragile':
    case 'recovery-locked':
    case 'exploration-bankrupt':
    case 'starvation-risk':
      return 0.15;
    case 'overextended':
      return 0.1;
    default: {
      const avg = ALL_RESOURCES.reduce((a, r) => a + state.levels[r], 0) / ALL_RESOURCES.length;
      if (avg < 40) return round2((40 - avg) / 100);
      return 0;
    }
  }
}

// ─── exhaustion forecast ───────────────────────────────────────

export function computeExhaustionForecasts(state: ResourceEconomyState): ExhaustionForecast[] {
  return ALL_RESOURCES.map((r) => {
    const level = state.levels[r];
    const burnRate = state.flows[r].burnRate;
    const netRate = -state.flows[r].emaRate;  // positive = net burning
    const eventsToZero = netRate > 0.05 ? Math.round(level / netRate) : null;
    return { resource: r, level, burnRate, eventsToZero };
  });
}

// ─── main update ───────────────────────────────────────────────

export interface ResourceEconomySignal {
  at: number;
  tick: number;
  directiveName: string;
  ecology: InternalEcologyState | null;
  governance: CognitiveGovernanceState | null;
  contradiction: ContradictionMemoryState | null;
}

export function updateResourceEconomy(
  state: ResourceEconomyState, signal: ResourceEconomySignal,
): { newState: ResourceEconomyState; bias: ScarcityBias; multiplier: number } {
  const baseCosts = baseCostsForDirective(signal.directiveName);
  const multiplier = computeCostMultiplier({
    ecology: signal.ecology,
    governance: signal.governance,
    contradiction: signal.contradiction,
    levels: state.levels,
  });

  // Compose effective deltas: base cost × multiplier + homeostatic
  // drift + ecology drift bias.
  const newLevels: ResourceLevels = { ...state.levels };
  const newFlows: Record<ResourceId, ResourceFlow> = { ...state.flows };
  const newObservations: ResourceObservation[] = [];

  let totalConsumed = state.totalConsumed;
  let totalRestored = state.totalRestored;

  for (const r of ALL_RESOURCES) {
    const baseDelta = baseCosts[r] ?? 0;
    const verbDelta = applyMultiplier(baseDelta, multiplier);
    const drift = homeostaticDrift(state.levels[r], RESOURCE_BASELINES[r]);
    const ecoDrift = ecologyDriftBias(r, signal.ecology);
    const total = round2(verbDelta + drift + ecoDrift);

    const before = state.levels[r];
    const after = round1(clamp100(before + total));
    const realized = round2(after - before);

    newLevels[r] = after;
    newFlows[r] = updateFlow(state.flows[r], realized);

    if (realized < 0) totalConsumed = round2(totalConsumed + -realized);
    if (realized > 0) totalRestored = round2(totalRestored + realized);

    if (Math.abs(realized) >= OBSERVATION_DELTA_THRESHOLD) {
      newObservations.push({
        at: signal.at, tick: signal.tick,
        resource: r, level: after, delta: realized,
      });
    }
  }

  const observationHistory = [...state.observationHistory, ...newObservations];

  // Collapse state.
  const collapseState = classifyCollapse(newLevels);

  // Species allocation + conflicts.
  const speciesAllocation: SpeciesAllocation[] = signal.ecology
    ? (['explorer', 'conservator', 'optimizer', 'guardian'] as EcologySpeciesId[]).map((id) => {
        const sp = signal.ecology!.species.find((s) => s.id === id);
        return speciesAllocationFor(id, sp?.intensity ?? 5, newLevels);
      })
    : [];
  const allocationConflicts = computeAllocationConflicts(speciesAllocation, signal.ecology, newLevels);

  const reserveAggregate = round1(
    ALL_RESOURCES.reduce((a, r) => a + newLevels[r], 0) / ALL_RESOURCES.length,
  );

  const bias = computeScarcityBias(newLevels);

  const newState: ResourceEconomyState = {
    levels: newLevels,
    flows: newFlows,
    observationHistory,
    collapseState,
    speciesAllocation,
    allocationConflicts,
    reserveAggregate,
    totalConsumed,
    totalRestored,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };

  return { newState, bias, multiplier };
}
