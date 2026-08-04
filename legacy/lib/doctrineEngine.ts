/**
 * DOCTRINE ENGINE (Wave 42)
 *
 * Statistical pattern recognition over operational signals. Each
 * cognitive event the engine evaluates current state against
 * eight doctrine templates; templates that match above a confidence
 * threshold log a doctrine match + outcome sample. Doctrines
 * accumulate EWMA-smoothed survivability / continuity / resource
 * impact across their recurrence count.
 *
 * Repeated failure under the same doctrine grows a scar — a
 * persistent aversion that biases future governance.
 *
 * Collapse archetypes are detected from specific failure signatures
 * (resource exhaustion loops, contradiction spirals, etc.) with
 * recurrence-confidence tracking.
 *
 * No narratives. Pure statistical operational precedent.
 */

import type {
  Doctrine, DoctrineId, DoctrineMatch, DoctrineOutcomeSample,
  Scar, CollapseArchetype, CollapseArchetypeId,
} from './historicalMemory';
import type { InternalEcologyState } from './internalEcologyMemory';
import type { CognitiveGovernanceState } from './cognitiveGovernance';
import type { ResourceEconomyState } from './resourceEconomyMemory';
import type { EnvironmentMemoryState } from './environmentMemory';
import type { ContradictionMemoryState } from './contradictionMemory';
import type { MissionContinuityState } from './missionContinuityMemory';
import type { MetaCognitiveState } from './metaCognitive';

// ─── tuning constants ──────────────────────────────────────────

export const DOCTRINE_OUTCOME_EWMA = 0.15;
export const DOCTRINE_MATCH_THRESHOLD = 0.5;
export const SCAR_INCIDENT_THRESHOLD = -1.5;   // survivability impact drop
export const SCAR_DECAY_PER_EVENT = 0.02;
export const SCAR_INTENSITY_CAP = 10;
export const ARCHETYPE_DETECTION_THRESHOLD = 0.6;
export const ARCHETYPE_CONFIDENCE_EWMA = 0.1;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── doctrine match templates ──────────────────────────────────
//
// Each template returns a match strength 0..1. Match strength is
// the AND-conjunction of normalized signal contributions — the
// pattern only fires when MULTIPLE conditions are simultaneously
// strong. This prevents single-axis noise from triggering matches.

export interface DoctrineMatchContext {
  cognitionThroughput: number;        // 0..1 governance gradient
  recoveryWeighting: number;          // 0..1 governance gradient
  escalationPermission: number;       // 0..1
  explorationIntensity: number;       // 0..1
  governanceZone: string;
  ecologyState: string;
  envState: string;
  envThreat: number;                  // 0..10
  envOpportunity: number;             // 0..10
  envVolatility: number;              // 0..10
  resourceAggregate: number;          // 0..100
  resourceCollapseState: string;
  contradictionMax: number;           // 0..10
  continuityIntegrity: number;        // 0..10
  continuityDrift: number;            // 0..10
  missionMutations: number;           // count
  reliability: number;                // 0..10
}

type DoctrineTemplate = (ctx: DoctrineMatchContext) => DoctrineMatch | null;

const DOCTRINE_TEMPLATES: Record<DoctrineId, DoctrineTemplate> = {
  'fragmentation-doctrine': (ctx) => {
    // high throughput + low recovery weighting
    const throughput = ctx.cognitionThroughput;
    const lowRecovery = 1 - ctx.recoveryWeighting;
    const strength = round2(clamp01((throughput + lowRecovery) / 2));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'fragmentation-doctrine', matchStrength: strength, trigger: 'throughput>recovery' };
  },

  'preservation-doctrine': (ctx) => {
    // protective governance + high continuity
    const protectiveGov = ctx.governanceZone === 'high-trust' || ctx.governanceZone === 'watchful' ? 0.6 : 0.3;
    const continuityScore = ctx.continuityIntegrity / 10;
    const recoveryWeighting = ctx.recoveryWeighting;
    const strength = round2(clamp01((protectiveGov + continuityScore + recoveryWeighting * 0.5) / 2.5));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'preservation-doctrine', matchStrength: strength, trigger: 'continuity-preserved' };
  },

  'mutation-doctrine': (ctx) => {
    // mutations spawning + drift rising
    const mutationFactor = Math.min(1, ctx.missionMutations / 3);
    const driftScore = ctx.continuityDrift / 10;
    const explorationScore = ctx.explorationIntensity;
    const strength = round2(clamp01((mutationFactor + driftScore + explorationScore * 0.5) / 2.5));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'mutation-doctrine', matchStrength: strength, trigger: 'mutation-cascade-active' };
  },

  'stability-doctrine': (ctx) => {
    // low volatility + high integrity + low drift
    const lowVolatility = (10 - ctx.envVolatility) / 10;
    const highIntegrity = ctx.continuityIntegrity / 10;
    const lowDrift = (10 - ctx.continuityDrift) / 10;
    const strength = round2(clamp01((lowVolatility + highIntegrity + lowDrift) / 3));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'stability-doctrine', matchStrength: strength, trigger: 'low-volatility-high-integrity' };
  },

  'exhaustion-doctrine': (ctx) => {
    // sustained low resources + low reliability
    const lowResources = ctx.resourceAggregate < 50 ? (50 - ctx.resourceAggregate) / 50 : 0;
    const lowReliability = (10 - ctx.reliability) / 10;
    const strength = round2(clamp01((lowResources + lowReliability) / 2));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'exhaustion-doctrine', matchStrength: strength, trigger: 'resource+reliability-low' };
  },

  'expansion-doctrine': (ctx) => {
    // opportunity-rich climate + high exploration
    const opportunityScore = ctx.envOpportunity / 10;
    const explorationScore = ctx.explorationIntensity;
    const lowThreat = (10 - ctx.envThreat) / 10;
    const strength = round2(clamp01((opportunityScore + explorationScore + lowThreat * 0.5) / 2.5));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'expansion-doctrine', matchStrength: strength, trigger: 'opportunity-rich' };
  },

  'throttle-doctrine': (ctx) => {
    // restricted governance + low throughput
    const restrictedGov = ctx.governanceZone === 'restricted' || ctx.governanceZone === 'suspended' ? 0.7 : 0.2;
    const lowThroughput = (1 - ctx.cognitionThroughput);
    const strength = round2(clamp01((restrictedGov + lowThroughput) / 1.7));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'throttle-doctrine', matchStrength: strength, trigger: 'governance-restricted' };
  },

  'collapse-doctrine': (ctx) => {
    // multi-resource depletion + critical reliability
    const collapseStateScore =
      ctx.resourceCollapseState === 'liquidity-collapse' ? 1 :
      ctx.resourceCollapseState === 'depleted' ? 0.8 :
      ctx.resourceCollapseState === 'contradiction-fragile' ? 0.7 :
      ctx.resourceCollapseState === 'starvation-risk' ? 0.6 :
      ctx.resourceCollapseState === 'recovery-locked' ? 0.5 :
      ctx.resourceCollapseState === 'overextended' ? 0.3 : 0;
    const criticalReliability = ctx.reliability < 4 ? (4 - ctx.reliability) / 4 : 0;
    const highContradiction = ctx.contradictionMax > 7 ? (ctx.contradictionMax - 7) / 3 : 0;
    const strength = round2(clamp01((collapseStateScore + criticalReliability + highContradiction) / 2));
    if (strength < DOCTRINE_MATCH_THRESHOLD) return null;
    return { doctrineId: 'collapse-doctrine', matchStrength: strength, trigger: 'critical-multi-axis' };
  },
};

export function evaluateDoctrines(ctx: DoctrineMatchContext): DoctrineMatch[] {
  const matches: DoctrineMatch[] = [];
  for (const template of Object.values(DOCTRINE_TEMPLATES)) {
    const m = template(ctx);
    if (m) matches.push(m);
  }
  return matches.sort((a, b) => b.matchStrength - a.matchStrength);
}

// ─── doctrine outcome update ───────────────────────────────────

export interface DoctrineUpdateContext {
  reliability: number;          // 0..10
  prevReliability: number;
  continuity: number;           // 0..10
  prevContinuity: number;
  resourceAggregate: number;
  adaptationContinuity: number;
  resourceCollapseState: string;
  at: number;
  tick: number;
}

export function updateDoctrineFromMatch(
  doctrine: Doctrine, match: DoctrineMatch, ctx: DoctrineUpdateContext,
): { doctrine: Doctrine; harmDelta: number } {
  const survivabilityDelta = (ctx.reliability - ctx.prevReliability) * match.matchStrength;
  const continuityDelta = (ctx.continuity - ctx.prevContinuity) * match.matchStrength;

  const survivabilityImpact = round2(
    doctrine.survivabilityImpact * (1 - DOCTRINE_OUTCOME_EWMA)
    + survivabilityDelta * DOCTRINE_OUTCOME_EWMA,
  );
  const continuityImpact = round2(
    doctrine.continuityImpact * (1 - DOCTRINE_OUTCOME_EWMA)
    + continuityDelta * DOCTRINE_OUTCOME_EWMA,
  );

  const resourceCost = round1(
    doctrine.resourceCost * (1 - DOCTRINE_OUTCOME_EWMA)
    + ctx.resourceAggregate * DOCTRINE_OUTCOME_EWMA,
  );
  const adaptationEffect = round1(
    doctrine.adaptationEffect * (1 - DOCTRINE_OUTCOME_EWMA)
    + ctx.adaptationContinuity * DOCTRINE_OUTCOME_EWMA,
  );

  const collapseFired =
    ctx.resourceCollapseState !== 'healthy' && ctx.resourceCollapseState !== 'overextended';
  const collapseAssociation = doctrine.collapseAssociation + (collapseFired ? 1 : 0);

  // Recovery = reliability rebounded from sub-5 territory
  const recoveryFired = ctx.prevReliability < 5 && ctx.reliability >= 5;
  const recoveryAssociation = doctrine.recoveryAssociation + (recoveryFired ? 1 : 0);

  // Long-horizon score: composite of impacts. Higher reliability +
  // continuity + lower collapse → higher score.
  const collapseRate = doctrine.recurrenceCount > 0
    ? collapseAssociation / Math.max(1, doctrine.recurrenceCount)
    : 0;
  const longHorizonScore = round1(clamp10(
    5
    + survivabilityImpact
    + continuityImpact * 0.5
    - collapseRate * 5,
  ));

  const sample: DoctrineOutcomeSample = {
    at: ctx.at, tick: ctx.tick,
    reliabilityAtSample: ctx.reliability,
    continuityAtSample: ctx.continuity,
    resourceAtSample: ctx.resourceAggregate,
    matchStrength: match.matchStrength,
  };

  return {
    doctrine: {
      ...doctrine,
      recurrenceCount: doctrine.recurrenceCount + 1,
      survivabilityImpact, continuityImpact,
      resourceCost, adaptationEffect,
      collapseAssociation, recoveryAssociation,
      longHorizonScore,
      recentSamples: [...doctrine.recentSamples, sample],
      firstObservedAt: doctrine.firstObservedAt ?? ctx.at,
      firstObservedTick: doctrine.firstObservedTick || ctx.tick,
      lastObservedAt: ctx.at,
      lastObservedTick: ctx.tick,
    },
    harmDelta: round2(-(survivabilityDelta + continuityDelta * 0.5)),
  };
}

// ─── scar accumulation ────────────────────────────────────────

export function updateScarFromHarm(
  prev: Scar | undefined, doctrineId: DoctrineId,
  harm: number, at: number, tick: number,
): Scar | null {
  if (harm < SCAR_INCIDENT_THRESHOLD) return prev ?? null;
  // Build/grow scar.
  const base: Scar = prev ?? {
    doctrineId,
    intensity: 0,
    incidentCount: 0,
    lastIncidentTick: 0,
    averageHarm: 0,
  };
  const newIntensity = round1(clamp(0, SCAR_INTENSITY_CAP, base.intensity + harm * 0.5));
  const incidentCount = base.incidentCount + 1;
  const averageHarm = round2(
    base.averageHarm * (1 - DOCTRINE_OUTCOME_EWMA) + harm * DOCTRINE_OUTCOME_EWMA,
  );
  return {
    doctrineId,
    intensity: newIntensity,
    incidentCount,
    lastIncidentTick: tick,
    averageHarm,
  };
}

/** Per-event scar decay applied to ALL scars (whether reinforced this event or not). */
export function decayScars(scars: Record<string, Scar>): Record<string, Scar> {
  const out: Record<string, Scar> = {};
  for (const [k, v] of Object.entries(scars)) {
    const next = Math.max(0, v.intensity - SCAR_DECAY_PER_EVENT);
    if (next > 0.1) out[k] = { ...v, intensity: round1(next) };
    // Scars below 0.1 fade out completely.
  }
  return out;
}

// ─── collapse archetype detection ──────────────────────────────

export interface CollapseDetectionContext {
  resourceCollapseState: string;
  resourceAggregate: number;
  contradictionMax: number;
  missionDrift: number;
  missionMutations: number;
  envState: string;
  governanceZone: string;
  reliabilityTrend: number;  // signed
}

/** Returns the archetypes whose detection-condition fires for this event. */
export function detectCollapseArchetypes(
  ctx: CollapseDetectionContext,
): Array<{ archetypeId: CollapseArchetypeId; severity: number }> {
  const detections: Array<{ archetypeId: CollapseArchetypeId; severity: number }> = [];

  // resource-exhaustion-loop: repeatedly hitting depleted / starvation-risk
  if (ctx.resourceCollapseState === 'depleted'
    || ctx.resourceCollapseState === 'starvation-risk'
    || ctx.resourceCollapseState === 'liquidity-collapse') {
    detections.push({ archetypeId: 'resource-exhaustion-loop', severity: round1((50 - ctx.resourceAggregate) / 5) });
  }
  // contradiction-spiral: contradiction max high AND reliability falling
  if (ctx.contradictionMax >= 7 && ctx.reliabilityTrend < -0.3) {
    detections.push({ archetypeId: 'contradiction-spiral', severity: round1(ctx.contradictionMax - 5) });
  }
  // mutation-cascade: many mutations in lineage
  if (ctx.missionMutations >= 3) {
    detections.push({ archetypeId: 'mutation-cascade', severity: round1(Math.min(10, ctx.missionMutations)) });
  }
  // continuity-erosion: high drift + falling reliability
  if (ctx.missionDrift >= 5 && ctx.reliabilityTrend < -0.2) {
    detections.push({ archetypeId: 'continuity-erosion', severity: round1(ctx.missionDrift - 3) });
  }
  // hostile-environment-amplification: hostile/collapse-prone env AND falling resources
  if ((ctx.envState === 'hostile' || ctx.envState === 'collapse-prone') && ctx.resourceAggregate < 50) {
    detections.push({ archetypeId: 'hostile-environment-amplification', severity: round1((50 - ctx.resourceAggregate) / 5 + 3) });
  }
  // governance-over-throttling: suspended/restricted while reliability is OK
  if ((ctx.governanceZone === 'suspended' || ctx.governanceZone === 'restricted')
    && ctx.reliabilityTrend >= 0) {
    detections.push({ archetypeId: 'governance-over-throttling', severity: round1(ctx.governanceZone === 'suspended' ? 8 : 5) });
  }
  // adaptation-runaway: high drift + many mutations + ecology unstable
  if (ctx.missionDrift >= 5 && ctx.missionMutations >= 2
    && (ctx.envState === 'unstable' || ctx.envState === 'turbulent')) {
    detections.push({ archetypeId: 'adaptation-runaway', severity: round1(ctx.missionDrift + ctx.missionMutations) });
  }

  return detections;
}

export function updateCollapseArchetype(
  prev: CollapseArchetype, severity: number, at: number, tick: number,
): CollapseArchetype {
  const detectionCount = prev.detectionCount + 1;
  // recurrence confidence rises with repeated detections; decays with absence
  const confidence = round2(clamp01(
    prev.recurrenceConfidence * (1 - ARCHETYPE_CONFIDENCE_EWMA)
    + Math.min(1, detectionCount / 10) * ARCHETYPE_CONFIDENCE_EWMA + 0.15,
  ));
  const averageSeverity = round1(
    prev.averageSeverity * (1 - ARCHETYPE_CONFIDENCE_EWMA)
    + severity * ARCHETYPE_CONFIDENCE_EWMA,
  );
  return {
    archetypeId: prev.archetypeId,
    detectionCount, recurrenceConfidence: confidence,
    averageSeverity,
    lastDetectedTick: tick, lastDetectedAt: at,
  };
}

/** Per-event passive confidence decay applied to archetypes
 *  not detected this event. */
export function decayCollapseArchetypeConfidence(
  archetype: CollapseArchetype,
): CollapseArchetype {
  if (archetype.recurrenceConfidence <= 0) return archetype;
  return {
    ...archetype,
    recurrenceConfidence: round2(Math.max(0, archetype.recurrenceConfidence - 0.005)),
  };
}
