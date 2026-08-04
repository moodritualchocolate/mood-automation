/**
 * HISTORICAL MEMORY ENGINE (Wave 42)
 *
 * Per-event orchestrator: blends event signature into the current
 * epoch's accumulator, transitions epoch when divergence persists,
 * evaluates all eight doctrine templates and updates the doctrines
 * they match with outcome samples, decays scars / archetype
 * confidence, detects collapse archetypes, recomputes civilization
 * maturity score and state with hysteresis, and emits a
 * HistoricalBias struct that biases governance toward historical
 * caution where precedent has shown harm.
 *
 * Pure deterministic. Same history → same epochs / doctrines /
 * scars / maturity.
 */

import type {
  HistoricalMemoryState, Doctrine, DoctrineId, Scar,
  CollapseArchetypeId, CivilizationMaturityState, CivilizationTransition,
} from './historicalMemory';
import type { InternalEcologyState } from './internalEcologyMemory';
import type { CognitiveGovernanceState } from './cognitiveGovernance';
import type { ResourceEconomyState } from './resourceEconomyMemory';
import type { EnvironmentMemoryState } from './environmentMemory';
import type { ContradictionMemoryState } from './contradictionMemory';
import type { MissionContinuityState } from './missionContinuityMemory';
import type { MetaCognitiveState } from './metaCognitive';
import {
  evaluateDoctrines, updateDoctrineFromMatch,
  updateScarFromHarm, decayScars,
  detectCollapseArchetypes, updateCollapseArchetype,
  decayCollapseArchetypeConfidence,
  type DoctrineMatchContext, type CollapseDetectionContext,
} from './doctrineEngine';
import {
  eventSignature, blendSignature, maybeTransitionEpoch,
  newEpoch, closeEpoch,
} from './civilizationEpochs';

// ─── tuning constants ──────────────────────────────────────────

export const MATURITY_HYSTERESIS_TICKS = 6;
export const HISTORICAL_BIAS_CLAMP = 0.20;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function clampBias(n: number): number { return clamp(-HISTORICAL_BIAS_CLAMP, HISTORICAL_BIAS_CLAMP, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── maturity computation ─────────────────────────────────────

export interface MaturityInputs {
  totalEpochs: number;
  doctrines: Record<DoctrineId, Doctrine>;
  scars: Record<string, Scar>;
  collapseArchetypeRecurrence: number;       // sum of recurrenceConfidence
  recentReliability: number;                 // 0..10
  recentContinuity: number;                  // 0..10
}

export function computeMaturityScore(m: MaturityInputs): number {
  // Components:
  // - epoch experience: log-scaled
  const epochExperience = Math.min(3, Math.log10(Math.max(1, m.totalEpochs + 1)) * 2);
  // - doctrine repertoire: count of doctrines with at least 3 recurrences
  const knownDoctrines = Object.values(m.doctrines).filter((d) => d.recurrenceCount >= 3).length;
  const doctrineExperience = Math.min(3, knownDoctrines * 0.6);
  // - performance: recent reliability + continuity contribute positively
  const performance = (m.recentReliability + m.recentContinuity) / 5;  // 0..4
  // - scars: small negative if too many scars dragging maturity to traumatized
  const totalScarIntensity = Object.values(m.scars).reduce((a, s) => a + s.intensity, 0);
  const scarPenalty = totalScarIntensity > 15 ? Math.min(2, (totalScarIntensity - 15) * 0.1) : 0;
  // - collapse archetype recurrence: small drag if many confirmed
  const archetypePenalty = m.collapseArchetypeRecurrence > 2 ? Math.min(1, (m.collapseArchetypeRecurrence - 2) * 0.3) : 0;
  return round1(clamp10(epochExperience + doctrineExperience + performance - scarPenalty - archetypePenalty));
}

export function classifyMaturity(
  prev: CivilizationMaturityState, score: number,
  scars: Record<string, Scar>, archetypeRecurrence: number,
  continuityIntegrity: number,
): CivilizationMaturityState {
  const activeScars = Object.values(scars).filter((s) => s.intensity >= 2).length;
  const totalScarIntensity = Object.values(scars).reduce((a, s) => a + s.intensity, 0);
  if (totalScarIntensity >= 25) return 'over-traumatized';
  if (score < 2) return 'naive';
  if (score >= 7.5 && activeScars <= 2 && archetypeRecurrence < 2) return 'mature-stable';
  if (continuityIntegrity >= 7 && activeScars === 0) return 'continuity-trained';
  if (archetypeRecurrence >= 2 && activeScars >= 1) return 'collapse-sensitive';
  if (activeScars >= 2) return 'scar-conditioned';
  if (score >= 4) return 'historically-aware';
  return 'adaptive';
}

function transitionMaturity(
  prev: CivilizationMaturityState, prevTicks: number, candidate: CivilizationMaturityState,
): { state: CivilizationMaturityState; ticks: number; transitioned: boolean } {
  if (candidate === prev) return { state: prev, ticks: prevTicks + 1, transitioned: false };
  if (prevTicks < MATURITY_HYSTERESIS_TICKS) {
    return { state: prev, ticks: prevTicks + 1, transitioned: false };
  }
  return { state: candidate, ticks: 1, transitioned: true };
}

// ─── historical bias output ───────────────────────────────────

export interface HistoricalBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

export function computeHistoricalBias(state: HistoricalMemoryState): HistoricalBias {
  // Sum of scar pressure per doctrine, mapped to which gradients the
  // doctrine would push when matched (inverted — scars push AWAY).
  let throughput = 0, escalation = 0, exploration = 0;
  let defer = 0, recovery = 0, burst = 0;
  const totalScarIntensity = Object.values(state.scars).reduce((a, s) => a + s.intensity, 0);

  for (const scar of Object.values(state.scars)) {
    if (scar.intensity < 1) continue;
    const i = scar.intensity / 10;  // 0..1
    switch (scar.doctrineId) {
      case 'fragmentation-doctrine':
        throughput -= i * 0.20;
        burst -= i * 0.15;
        defer += i * 0.15;
        recovery += i * 0.10;
        break;
      case 'mutation-doctrine':
        exploration -= i * 0.20;
        burst -= i * 0.10;
        defer += i * 0.10;
        break;
      case 'exhaustion-doctrine':
        throughput -= i * 0.15;
        recovery += i * 0.20;
        defer += i * 0.15;
        break;
      case 'collapse-doctrine':
        throughput -= i * 0.25;
        escalation -= i * 0.20;
        exploration -= i * 0.20;
        recovery += i * 0.25;
        defer += i * 0.20;
        burst -= i * 0.20;
        break;
      case 'throttle-doctrine':
        // Throttle scars mean over-throttling has hurt — push TOWARD action
        throughput += i * 0.10;
        escalation += i * 0.05;
        defer -= i * 0.05;
        break;
    }
  }

  // Collapse archetype recurrence adds general restriction.
  const archConfidence = Object.values(state.collapseArchetypes)
    .reduce((a, c) => a + c.recurrenceConfidence, 0);
  if (archConfidence > 0) {
    const factor = Math.min(1, archConfidence);
    throughput -= factor * 0.05;
    escalation -= factor * 0.05;
    defer += factor * 0.05;
    recovery += factor * 0.05;
  }

  // Maturity adds slight positive throughput permission (mature organisms
  // operate confidently within their tested envelope).
  const maturityFactor = state.maturityScore / 10;
  if (state.maturityState === 'mature-stable' || state.maturityState === 'continuity-trained') {
    throughput += maturityFactor * 0.05;
    escalation += maturityFactor * 0.05;
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

export function applyHistoricalBias<G extends HistoricalBias>(
  gradients: G, bias: HistoricalBias,
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

/** Simulation pressure from historical precedent — rises with active
 *  scars + collapse archetype recurrence. 0..0.2. */
export function historicalPressureContribution(state: HistoricalMemoryState): number {
  const activeScarPressure = Object.values(state.scars)
    .reduce((a, s) => a + s.intensity, 0) / 50;  // 5 active scars at 10 → 1.0
  const archetypeConfidence = Object.values(state.collapseArchetypes)
    .reduce((a, c) => a + c.recurrenceConfidence, 0) / 3;  // 3 confirmed archetypes → 1.0
  return round2(Math.min(0.2, (activeScarPressure + archetypeConfidence) * 0.1));
}

// ─── main update ───────────────────────────────────────────────

export interface HistoricalMemorySignal {
  at: number;
  tick: number;
  ecology: InternalEcologyState | null;
  mission: MissionContinuityState | null;
  governance: CognitiveGovernanceState | null;
  environment: EnvironmentMemoryState | null;
  resource: ResourceEconomyState | null;
  contradiction: ContradictionMemoryState | null;
  meta: MetaCognitiveState | null;
  /** Previous-event reliability for trend computation. */
  prevReliability: number;
  prevContinuity: number;
}

export function updateHistoricalMemory(
  state: HistoricalMemoryState, sig: HistoricalMemorySignal,
): HistoricalMemoryState {
  // 1. Event signature.
  const sample = eventSignature({
    ecology: sig.ecology, mission: sig.mission, governance: sig.governance,
    environment: sig.environment, resource: sig.resource,
    contradiction: sig.contradiction, meta: sig.meta,
  });

  // 2. Epoch transition decision.
  const { shouldTransition, newEpochArchetype, finalEpochSignature } =
    maybeTransitionEpoch(state, sample, sig.at, sig.tick);

  let epochs = state.epochs;
  let signatureAccumulator = state.signatureAccumulator;
  let signatureSampleCount = state.signatureSampleCount;
  let totalEpochs = state.totalEpochs;

  if (shouldTransition && newEpochArchetype) {
    // Close current epoch (if any) and open new one.
    if (epochs.length > 0 && finalEpochSignature) {
      const closed = closeEpoch(epochs[epochs.length - 1], finalEpochSignature, sig.at, sig.tick);
      epochs = [...epochs.slice(0, -1), closed];
    }
    const next = newEpoch(newEpochArchetype, sample, sig.at, sig.tick, totalEpochs);
    epochs = [...epochs, next];
    totalEpochs += 1;
    signatureAccumulator = sample;
    signatureSampleCount = 0;
  } else {
    signatureAccumulator = blendSignature(signatureAccumulator, sample, signatureSampleCount);
    signatureSampleCount += 1;
  }

  // 3. Evaluate doctrines.
  const ctx: DoctrineMatchContext = {
    cognitionThroughput: sig.governance?.gradients.cognitionThroughput ?? 1,
    recoveryWeighting:   sig.governance?.gradients.recoveryWeighting ?? 0.5,
    escalationPermission: sig.governance?.gradients.escalationPermission ?? 1,
    explorationIntensity: sig.governance?.gradients.explorationIntensity ?? 1,
    governanceZone: sig.governance?.zone ?? 'high-trust',
    ecologyState: sig.ecology?.state ?? 'balanced',
    envState: sig.environment?.state ?? 'stable',
    envThreat: sig.environment?.levels.threatPressure ?? 0,
    envOpportunity: sig.environment?.levels.opportunityDensity ?? 5,
    envVolatility: sig.environment?.levels.volatility ?? 0,
    resourceAggregate: sig.resource?.reserveAggregate ?? 56,
    resourceCollapseState: sig.resource?.collapseState ?? 'healthy',
    contradictionMax: sig.contradiction
      ? sig.contradiction.pairs.reduce((m, p) => Math.max(m, p.tensionScore), 0)
      : 0,
    continuityIntegrity: sig.mission?.missionIntegrity ?? 7,
    continuityDrift: sig.mission?.existentialDrift ?? 0,
    missionMutations: sig.mission
      ? sig.mission.vectors.filter((v) => v.parentVectorId !== null).length
      : 0,
    reliability: sig.meta?.cumulativeReliabilityScore ?? 7,
  };
  const matches = evaluateDoctrines(ctx);

  // 4. Update doctrines for each match.
  const doctrines = { ...state.doctrines };
  let scars = decayScars(state.scars);
  let totalDoctrineMatches = state.totalDoctrineMatches;
  for (const match of matches) {
    const d = doctrines[match.doctrineId];
    const { doctrine, harmDelta } = updateDoctrineFromMatch(d, match, {
      reliability: sig.meta?.cumulativeReliabilityScore ?? 7,
      prevReliability: sig.prevReliability,
      continuity: sig.mission?.missionIntegrity ?? 7,
      prevContinuity: sig.prevContinuity,
      resourceAggregate: ctx.resourceAggregate,
      adaptationContinuity: sig.mission?.adaptationContinuity ?? 6,
      resourceCollapseState: ctx.resourceCollapseState,
      at: sig.at, tick: sig.tick,
    });
    doctrines[match.doctrineId] = doctrine;
    totalDoctrineMatches += 1;

    // Update scar if harm was significant.
    if (harmDelta >= 1.5) {
      const updated = updateScarFromHarm(scars[match.doctrineId], match.doctrineId, harmDelta, sig.at, sig.tick);
      if (updated) scars = { ...scars, [match.doctrineId]: updated };
    }

    // Track doctrine in current epoch.
    if (epochs.length > 0) {
      const cur = epochs[epochs.length - 1];
      if (!cur.doctrineOutcomes.includes(match.doctrineId)) {
        epochs = [...epochs.slice(0, -1), {
          ...cur,
          doctrineOutcomes: [...cur.doctrineOutcomes, match.doctrineId],
        }];
      }
    }
  }
  // Update epoch totalEvents counter.
  if (epochs.length > 0) {
    const cur = epochs[epochs.length - 1];
    epochs = [...epochs.slice(0, -1), { ...cur, totalEvents: cur.totalEvents + 1 }];
  }

  // 5. Collapse archetype detection.
  const reliabilityTrend = (sig.meta?.cumulativeReliabilityScore ?? 7) - sig.prevReliability;
  const collapseCtx: CollapseDetectionContext = {
    resourceCollapseState: ctx.resourceCollapseState,
    resourceAggregate: ctx.resourceAggregate,
    contradictionMax: ctx.contradictionMax,
    missionDrift: ctx.continuityDrift,
    missionMutations: ctx.missionMutations,
    envState: ctx.envState,
    governanceZone: ctx.governanceZone,
    reliabilityTrend,
  };
  const archetypeDetections = detectCollapseArchetypes(collapseCtx);
  const detectedIds = new Set(archetypeDetections.map((d) => d.archetypeId));
  const collapseArchetypes = { ...state.collapseArchetypes };
  for (const det of archetypeDetections) {
    collapseArchetypes[det.archetypeId] = updateCollapseArchetype(
      collapseArchetypes[det.archetypeId], det.severity, sig.at, sig.tick,
    );
  }
  // Decay archetypes not detected this event.
  for (const [k, v] of Object.entries(collapseArchetypes) as [CollapseArchetypeId, typeof collapseArchetypes[CollapseArchetypeId]][]) {
    if (!detectedIds.has(k)) {
      collapseArchetypes[k] = decayCollapseArchetypeConfidence(v);
    }
  }

  // 6. Maturity score + state.
  const archetypeRecurrence = Object.values(collapseArchetypes)
    .filter((c) => c.recurrenceConfidence >= 0.4).length;
  const maturityScore = computeMaturityScore({
    totalEpochs,
    doctrines,
    scars,
    collapseArchetypeRecurrence: archetypeRecurrence,
    recentReliability: sig.meta?.cumulativeReliabilityScore ?? 7,
    recentContinuity: sig.mission?.missionIntegrity ?? 7,
  });
  const candidateState = classifyMaturity(
    state.maturityState, maturityScore, scars, archetypeRecurrence,
    sig.mission?.missionIntegrity ?? 7,
  );
  const { state: maturityState, ticks: maturityPersistenceTicks, transitioned } =
    transitionMaturity(state.maturityState, state.maturityPersistenceTicks, candidateState);

  let transitions = state.transitions;
  if (transitioned) {
    transitions = [...transitions, {
      at: sig.at, tick: sig.tick,
      from: state.maturityState, to: maturityState,
      reason: `maturity ${maturityScore.toFixed(1)}/10, ${Object.values(scars).length} scars, ${archetypeRecurrence} confirmed archetypes`,
    }];
  }

  return {
    epochs,
    doctrines,
    scars,
    collapseArchetypes,
    signatureAccumulator,
    signatureSampleCount,
    maturityScore,
    maturityState,
    maturityPersistenceTicks,
    transitions,
    totalEpochs,
    totalDoctrineMatches,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? sig.at,
    updatedAt: sig.at,
  };
}
