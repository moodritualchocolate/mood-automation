/**
 * CIVILIZATION EPOCHS (Wave 42)
 *
 * Epoch segmentation from persistent pressure topology. The
 * algorithm accumulates an EWMA-smoothed signature each event
 * (dominant species, mission vector, governance zone, environment
 * state, etc.). When the current signature has diverged enough from
 * the active epoch's signature for sustained ticks, the epoch closes
 * and a new one begins.
 *
 * Hysteresis-banded so epochs don't thrash on momentary fluctuations.
 *
 * Each new epoch is classified into one of seven archetypes:
 *   expansion / recovery / fragmentation / scarcity /
 *   continuity-preservation / hyper-optimization /
 *   ecological-hostility / (transitional fallback).
 *
 * No narratives. Pure topological segmentation.
 */

import type {
  Epoch, EpochArchetype, EpochSignature, HistoricalMemoryState,
} from './historicalMemory';
import type { InternalEcologyState, SpeciesId } from './internalEcologyMemory';
import type { MissionContinuityState, StrategicDirection } from './missionContinuityMemory';
import type { CognitiveGovernanceState, TrustZone } from './cognitiveGovernance';
import type { EnvironmentMemoryState, EnvironmentState } from './environmentMemory';
import type { ResourceEconomyState } from './resourceEconomyMemory';
import type { ContradictionMemoryState } from './contradictionMemory';
import type { MetaCognitiveState } from './metaCognitive';

// ─── tuning constants ──────────────────────────────────────────

export const SIGNATURE_EWMA = 0.10;
/** Minimum events before epoch transition is allowed. */
export const MIN_EPOCH_DURATION = 8;
/** Divergence threshold to trigger epoch transition (composite). */
export const EPOCH_DIVERGENCE_THRESHOLD = 5;
/** Sustained-divergence ticks required before transition. */
export const EPOCH_HYSTERESIS_TICKS = 5;

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }

// ─── signature computation per event ───────────────────────────

export interface EpochSignatureSignal {
  ecology: InternalEcologyState | null;
  mission: MissionContinuityState | null;
  governance: CognitiveGovernanceState | null;
  environment: EnvironmentMemoryState | null;
  resource: ResourceEconomyState | null;
  contradiction: ContradictionMemoryState | null;
  meta: MetaCognitiveState | null;
}

export function eventSignature(sig: EpochSignatureSignal): EpochSignature {
  const maxTension = sig.contradiction
    ? sig.contradiction.pairs.reduce((m, p) => Math.max(m, p.tensionScore), 0)
    : 0;
  // Find dominant mission vector
  let dominantMissionVector: StrategicDirection | null = null;
  let maxWeight = 0;
  if (sig.mission) {
    for (const v of sig.mission.vectors) {
      if (v.persistenceWeight > maxWeight) {
        maxWeight = v.persistenceWeight;
        dominantMissionVector = v.strategicDirection;
      }
    }
  }
  // Reliability trend approximation
  const reliability = sig.meta?.cumulativeReliabilityScore ?? 7;
  // Adaptation pressure: ecology volatility + mission drift + env adaptation difficulty
  const adaptationPressure = round1(clamp10(
    (sig.ecology?.volatilityField ?? 0) * 0.3
    + (sig.mission?.existentialDrift ?? 0) * 0.4
    + (sig.environment?.levels.adaptationDifficulty ?? 0) * 0.3,
  ));
  // Collapse risk
  const collapseRisk = round1(clamp10(
    maxTension * 0.3
    + (sig.mission?.missionPressure ?? 0) * 0.3
    + (sig.environment?.levels.threatPressure ?? 0) * 0.3
    + (sig.resource && sig.resource.collapseState !== 'healthy' ? 3 : 0),
  ));
  return {
    dominantSpecies: sig.ecology?.dominantSpecies ?? null,
    dominantMissionVector,
    averageGovernanceZone: sig.governance?.zone ?? 'high-trust',
    environmentSignature: sig.environment?.state ?? 'stable',
    continuityState: sig.mission?.state ?? 'coherent',
    survivabilityTrend: reliability,
    contradictionDensity: round1(maxTension),
    resourceClimate: round1(sig.resource?.reserveAggregate ?? 56),
    collapseRisk,
    stabilityDuration: 0, // computed at epoch close
    adaptationPressure,
  };
}

// ─── signature divergence ──────────────────────────────────────

/** Distance between two epoch signatures on a composite 0..10ish scale.
 *  Higher = more divergent. */
export function signatureDistance(a: EpochSignature, b: EpochSignature): number {
  let d = 0;
  // Categorical fields → 2.0 distance if different.
  if (a.dominantSpecies !== b.dominantSpecies) d += 2;
  if (a.dominantMissionVector !== b.dominantMissionVector) d += 1.5;
  if (a.averageGovernanceZone !== b.averageGovernanceZone) d += 1.5;
  if (a.environmentSignature !== b.environmentSignature) d += 2;
  if (a.continuityState !== b.continuityState) d += 1.5;
  // Continuous fields → squared-difference contribution
  d += Math.abs(a.survivabilityTrend - b.survivabilityTrend) * 0.2;
  d += Math.abs(a.contradictionDensity - b.contradictionDensity) * 0.2;
  d += Math.abs(a.resourceClimate - b.resourceClimate) * 0.02;
  d += Math.abs(a.collapseRisk - b.collapseRisk) * 0.2;
  d += Math.abs(a.adaptationPressure - b.adaptationPressure) * 0.2;
  return round1(d);
}

// ─── EWMA blend (smoothing the accumulator) ────────────────────

function blendNumeric(a: number, b: number, alpha: number = SIGNATURE_EWMA): number {
  return round1(a * (1 - alpha) + b * alpha);
}

/** Update the signature accumulator with the latest event signature. */
export function blendSignature(
  acc: EpochSignature, sample: EpochSignature, count: number,
): EpochSignature {
  // Categorical fields take the most-recent observation (single-event
  // changes propagate; sustained-change requirement is enforced via
  // the divergence-hysteresis below). Numeric fields EWMA.
  return {
    dominantSpecies: sample.dominantSpecies,
    dominantMissionVector: sample.dominantMissionVector,
    averageGovernanceZone: sample.averageGovernanceZone,
    environmentSignature: sample.environmentSignature,
    continuityState: sample.continuityState,
    survivabilityTrend:  blendNumeric(acc.survivabilityTrend,  sample.survivabilityTrend),
    contradictionDensity: blendNumeric(acc.contradictionDensity, sample.contradictionDensity),
    resourceClimate:     blendNumeric(acc.resourceClimate,     sample.resourceClimate),
    collapseRisk:        blendNumeric(acc.collapseRisk,        sample.collapseRisk),
    stabilityDuration:   count + 1,
    adaptationPressure:  blendNumeric(acc.adaptationPressure,  sample.adaptationPressure),
  };
}

// ─── archetype classification ──────────────────────────────────

export function classifyEpochArchetype(sig: EpochSignature): EpochArchetype {
  if (sig.collapseRisk >= 6 && sig.resourceClimate < 40) return 'scarcity';
  if (sig.environmentSignature === 'hostile' || sig.environmentSignature === 'collapse-prone'
    || sig.environmentSignature === 'unstable') return 'ecological-hostility';
  if (sig.continuityState === 'continuity-fragile' || sig.continuityState === 'fractured'
    || sig.continuityState === 'mission-exhausted') return 'fragmentation';
  if (sig.continuityState === 'lineage-preserved' || sig.continuityState === 'adaptive-stable') return 'continuity-preservation';
  if (sig.dominantSpecies === 'optimizer' && sig.averageGovernanceZone === 'high-trust') return 'hyper-optimization';
  if (sig.dominantSpecies === 'conservator' || sig.dominantSpecies === 'guardian') return 'recovery';
  if (sig.dominantSpecies === 'explorer' && sig.contradictionDensity < 5) return 'expansion';
  return 'transitional';
}

// ─── transition tracker ────────────────────────────────────────

interface DivergenceTrackerState {
  consecutiveDivergent: number;
}

const globalForDiv = globalThis as unknown as { __moodEpochTracker?: DivergenceTrackerState };
function getTracker(): DivergenceTrackerState {
  if (!globalForDiv.__moodEpochTracker) {
    globalForDiv.__moodEpochTracker = { consecutiveDivergent: 0 };
  }
  return globalForDiv.__moodEpochTracker;
}

/** Decide whether the current epoch should close. Returns the new
 *  epoch state if so, else null. */
export function maybeTransitionEpoch(
  state: HistoricalMemoryState, currentSignature: EpochSignature,
  at: number, tick: number,
): {
  shouldTransition: boolean;
  newEpochArchetype: EpochArchetype | null;
  finalEpochSignature: EpochSignature | null;
} {
  const activeEpoch = state.epochs[state.epochs.length - 1];
  if (!activeEpoch) {
    return { shouldTransition: true, newEpochArchetype: classifyEpochArchetype(currentSignature), finalEpochSignature: null };
  }
  // Don't transition before MIN_EPOCH_DURATION events.
  const eventsInEpoch = state.signatureSampleCount;
  if (eventsInEpoch < MIN_EPOCH_DURATION) {
    return { shouldTransition: false, newEpochArchetype: null, finalEpochSignature: null };
  }
  const divergence = signatureDistance(state.signatureAccumulator, currentSignature);
  const tracker = getTracker();
  if (divergence >= EPOCH_DIVERGENCE_THRESHOLD) {
    tracker.consecutiveDivergent += 1;
  } else {
    tracker.consecutiveDivergent = Math.max(0, tracker.consecutiveDivergent - 1);
  }
  if (tracker.consecutiveDivergent >= EPOCH_HYSTERESIS_TICKS) {
    tracker.consecutiveDivergent = 0;
    return {
      shouldTransition: true,
      newEpochArchetype: classifyEpochArchetype(currentSignature),
      finalEpochSignature: state.signatureAccumulator,
    };
  }
  return { shouldTransition: false, newEpochArchetype: null, finalEpochSignature: null };
}

export function newEpoch(
  archetype: EpochArchetype, signature: EpochSignature,
  at: number, tick: number, idx: number,
): Epoch {
  return {
    id: `epoch-${archetype}-${tick}-${idx}`,
    archetype,
    startTick: tick,
    endTick: null,
    startedAt: at,
    endedAt: null,
    signature,
    doctrineOutcomes: [],
    totalEvents: 0,
  };
}

export function closeEpoch(
  epoch: Epoch, finalSignature: EpochSignature, at: number, tick: number,
): Epoch {
  return {
    ...epoch,
    endTick: tick,
    endedAt: at,
    signature: { ...finalSignature, stabilityDuration: tick - epoch.startTick },
  };
}
