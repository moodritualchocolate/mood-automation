/**
 * SELF MODEL VIEW (Wave 33)
 *
 * Dashboard view model + helper for defer thoughts. Pure derivation
 * from selfModelMemory state. No invented values.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  SelfModelMemoryState, Trait, TraitId,
  InstabilityWindow, DetectedPattern, ConsistencyObservation,
} from './selfModelMemory';

export type SelfModelStatus = 'stable' | 'adaptive' | 'volatile';

export interface SelfModelViewModel {
  present: boolean;
  status: SelfModelStatus;
  /** 0..10 — how clearly identity is defined right now. */
  identityCoherence: number;
  /** 0..10 — variance of identity across recent observations. */
  behaviorConsistency: number;
  /** 0..10 — composite stability. */
  selfStability: number;
  /** 0..10 — direct trait reading. */
  pressureResilience: number;
  /** 0..10 — direct trait reading. */
  fragmentationVolatility: number;
  /** 0..10 — direct trait reading. */
  recoveryDependence: number;
  /** Composite: defer maturity + recovery rhythm + coherence stability. */
  strategicMaturity: number;
  /** Lower = identity adapts faster; higher = identity sticks. */
  adaptationRigidity: number;
  /** 0..10 — longitudinal rolling identity score. */
  longitudinalIdentityScore: number;
  /** All ten traits with their current state and intensity. */
  traits: Array<{
    id: TraitId;
    label: string;
    intensity: number;
    state: string;
    observationCount: number;
  }>;
  /** Top 3 traits by intensity, excluding inactive. */
  dominantBehaviorModes: string[];
  /** Last 6 detected patterns. */
  recentPatterns: DetectedPattern[];
  /** Last 3 instability windows. */
  recentInstabilityWindows: InstabilityWindow[];
  /** Last 5 trait transitions. */
  recentTraitTransitions: Array<{
    at: number; tick: number; traitId: TraitId;
    from: string; to: string; reason: string;
  }>;
  /** Recent self-consistency snapshots. */
  recentSelfConsistency: ConsistencyObservation[];
  statement: string;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }

function getTrait(state: SelfModelMemoryState, id: TraitId): Trait | undefined {
  return state.traits.find((t) => t.id === id);
}

export function buildSelfModelView(snap: RuntimeSnapshot): SelfModelViewModel {
  const sm = snap.selfModel ?? null;
  if (!sm) {
    return {
      present: false,
      status: 'stable',
      identityCoherence: 5, behaviorConsistency: 7, selfStability: 7,
      pressureResilience: 5, fragmentationVolatility: 0,
      recoveryDependence: 0, strategicMaturity: 5, adaptationRigidity: 5,
      longitudinalIdentityScore: 5,
      traits: [], dominantBehaviorModes: [],
      recentPatterns: [], recentInstabilityWindows: [],
      recentTraitTransitions: [], recentSelfConsistency: [],
      statement: 'no self-model yet — identity will emerge as cognition accumulates',
    };
  }

  const traitReading = (id: TraitId): number => getTrait(sm, id)?.intensity ?? 0;

  // identityCoherence: count of clear-state traits.
  const clearTraitCount = sm.traits.filter(
    (t) => t.state === 'active' || t.state === 'fading',
  ).length;
  const identityCoherence = round1(clamp10(clearTraitCount * 1.25 + 2.5));

  // behaviorConsistency: variance over recent identity snapshots.
  const recent = sm.identityHistory.slice(-8);
  let behaviorConsistency = 7;
  if (recent.length >= 3) {
    const values = recent.map((s) => s.identityCoherence);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    behaviorConsistency = round1(clamp10(10 - Math.sqrt(variance) * 2));
  }

  // selfStability: from selfConsistencyHistory mean.
  const recentConsistency = sm.selfConsistencyHistory.slice(-5);
  const selfStability = recentConsistency.length === 0
    ? behaviorConsistency
    : round1(clamp10(
        recentConsistency.reduce((a, b) => a + b.value, 0) / recentConsistency.length,
      ));

  const pressureResilience = traitReading('pressure-resilient');
  const fragmentationVolatility = traitReading('fragmentation-prone');
  const recoveryDependence = traitReading('recovery-dependent');

  // strategicMaturity: composite of disciplined cadence + recovery + coherence.
  const strategicMaturity = round1(clamp10(
    (traitReading('cadence-disciplined') * 0.4) +
    (traitReading('recovery-dependent') * 0.3) +
    (traitReading('coherence-stable') * 0.3),
  ));

  // adaptationRigidity: how few trait transitions have happened recently.
  // Fewer = more rigid; more = more adaptive. Clamped 0..10.
  const recentTransitionCount = sm.traitEvolution.slice(-10).length;
  const adaptationRigidity = round1(clamp10(10 - recentTransitionCount));

  // Status banding.
  const status: SelfModelStatus =
    behaviorConsistency >= 7 && identityCoherence >= 6 ? 'stable' :
    behaviorConsistency >= 5 ? 'adaptive' :
    'volatile';

  const traits = sm.traits.map((t) => ({
    id: t.id, label: t.label, intensity: t.intensity, state: t.state,
    observationCount: t.observationCount,
  }));

  const dominantBehaviorModes = sm.dominantBehaviorModes
    .map((id) => sm.traits.find((t) => t.id === id)?.label ?? id);

  const recentPatterns = sm.persistentPatterns.slice(-6).reverse();
  const recentInstabilityWindows = sm.instabilityWindows.slice(-3).reverse();
  const recentTraitTransitions = sm.traitEvolution.slice(-5).reverse();
  const recentSelfConsistency = sm.selfConsistencyHistory.slice(-8);

  const statement = status === 'volatile'
    ? `self model VOLATILE — identity coherence ${identityCoherence}/10, consistency ${behaviorConsistency}/10`
    : status === 'adaptive'
      ? `self model adaptive — ${dominantBehaviorModes.length} dominant trait${dominantBehaviorModes.length === 1 ? '' : 's'}, consistency ${behaviorConsistency}/10`
      : `self model stable — identity coherence ${identityCoherence}/10, longitudinal score ${sm.longitudinalIdentityScore}/10`;

  return {
    present: true, status,
    identityCoherence, behaviorConsistency, selfStability,
    pressureResilience, fragmentationVolatility, recoveryDependence,
    strategicMaturity, adaptationRigidity,
    longitudinalIdentityScore: sm.longitudinalIdentityScore,
    traits, dominantBehaviorModes,
    recentPatterns, recentInstabilityWindows,
    recentTraitTransitions, recentSelfConsistency,
    statement,
  };
}

/**
 * Strongest active trait label (for inlining into defer thoughts
 * when one is meaningful). Returns null if no trait is in 'active'.
 */
export function strongestActiveTraitLabel(snap: RuntimeSnapshot): string | null {
  const sm = snap.selfModel;
  if (!sm) return null;
  const active = sm.traits
    .filter((t) => t.state === 'active')
    .sort((a, b) => b.intensity - a.intensity)[0];
  return active ? active.label : null;
}
