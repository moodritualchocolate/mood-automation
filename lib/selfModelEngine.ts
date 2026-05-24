/**
 * SELF-MODEL ENGINE (Wave 33)
 *
 * Deterministic self-model update. The engine reads:
 *   - temporal assessment (cognitionDensity, cadenceHealth, etc.)
 *   - purpose memory (goal states, abandonment counts)
 *   - contradiction memory (system tension, sacrifices, cumulative)
 *   - organism vitals (restCount, fatigue)
 *   - os runtime state (fragmentationStreak, wakeCount)
 *
 * and computes per-trait SIGNAL values (the current "evidence" for
 * each trait). The trait's stored intensity moves toward the signal
 * via EWMA, so identity evolves slowly.
 *
 * Pure functions throughout. Same inputs → same outputs forever.
 * No LLM, no randomness, no anthropomorphism.
 */

import type {
  SelfModelMemoryState, Trait, TraitId, TraitState,
  TraitTransitionRecord, IdentitySnapshot, InstabilityWindow,
  DetectedPattern, ConsistencyObservation,
} from './selfModelMemory';
import { TRAIT_EWMA_ALPHA, TRAIT_HISTORY_DELTA } from './selfModelMemory';
import type { OSRuntimeState } from './operatingSystemCore';
import type { OrganismVitalState } from './persistentOrganismCore';
import type { TemporalMemoryState } from './temporalMemory';
import type { TemporalAssessment } from './temporalIntelligenceView';
import type { PurposeMemoryState } from './purposeMemory';
import type { ContradictionMemoryState } from './contradictionMemory';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── trait state transitions (hysteresis bands) ────────────────

/** intensity ≥ this enters 'forming' from inactive. */
const FORMING_ENTRY = 3;
/** intensity ≥ this enters 'active' from forming. */
const ACTIVE_ENTRY = 6;
/** intensity < this exits 'active' into 'fading' (hysteresis: 6 to enter, 5 to fade). */
const ACTIVE_EXIT = 5;
/** intensity < this exits 'fading' / 'forming' to 'inactive'. */
const INACTIVE_EXIT = 3;

function nextTraitState(prev: TraitState, intensity: number): TraitState {
  switch (prev) {
    case 'inactive':
      if (intensity >= ACTIVE_ENTRY) return 'active';
      if (intensity >= FORMING_ENTRY) return 'forming';
      return 'inactive';
    case 'forming':
      if (intensity >= ACTIVE_ENTRY) return 'active';
      if (intensity < INACTIVE_EXIT) return 'inactive';
      return 'forming';
    case 'active':
      if (intensity < ACTIVE_EXIT) return 'fading';
      return 'active';
    case 'fading':
      if (intensity >= ACTIVE_ENTRY) return 'active';
      if (intensity < INACTIVE_EXIT) return 'inactive';
      return 'fading';
  }
}

// ─── signal computation per trait ─────────────────────────────

interface SelfSignalContext {
  os: OSRuntimeState;
  organism: OrganismVitalState;
  temporal: TemporalMemoryState;
  assessment: TemporalAssessment;
  purpose: PurposeMemoryState;
  contradiction: ContradictionMemoryState;
}

/**
 * Compute the current signal level (0..10) for each trait from
 * real observable state. These are the values that the EWMA-smoothed
 * trait.intensity will converge toward.
 */
function computeTraitSignals(ctx: SelfSignalContext): Record<TraitId, number> {
  const { os, organism, temporal, assessment, purpose, contradiction } = ctx;

  // Helper aggregations from temporal/contradiction memory.
  const recoveryCount = temporal.recoveryHistory.length;
  const totalActs = temporal.cadenceHistory.length;
  const deferCount = temporal.totalDefers;
  const fragmentationPeaks = temporal.fragmentationHistory.length;
  const contradictionEventCount = Object.values(contradiction.contradictionCountsByGoal)
    .reduce((a, b) => a + b, 0);
  const abandonedCount = purpose.goals.filter((g) => g.activationState === 'abandoned').length;
  const meanDrift = purpose.goals.length === 0
    ? 0
    : purpose.goals.reduce((a, b) => a + b.driftScore, 0) / purpose.goals.length;
  const coherenceGoal = purpose.goals.find((g) => g.id === 'goal-coherence');
  const coherenceActive = coherenceGoal && coherenceGoal.activationState === 'active' ? 10 : 0;
  const restPerAct = totalActs > 0 ? (recoveryCount / totalActs) * 20 : 0;
  const deferPerAct = totalActs > 0 ? (deferCount / totalActs) * 25 : 0;
  const fragmentationPerAct = totalActs > 0 ? (fragmentationPeaks / totalActs) * 20 : 0;
  const contradictionPerAct = totalActs > 0 ? (contradictionEventCount / totalActs) * 15 : 0;

  return {
    // cadence-disciplined: high cadenceHealth means healthy rhythm.
    'cadence-disciplined': clamp10(assessment.cadenceHealth),

    // recovery-dependent: signal scales with how often rest fires
    // relative to total cognitive acts.
    'recovery-dependent': clamp10(restPerAct),

    // fragmentation-prone: rate of fragmentation peaks per act.
    'fragmentation-prone': clamp10(fragmentationPerAct),

    // contradiction-sensitive: rate of contradiction events per act.
    'contradiction-sensitive': clamp10(contradictionPerAct),

    // coherence-stable: high only when the maintain-coherence goal
    // sits in 'active' state.
    'coherence-stable': clamp10(coherenceActive),

    // abandonment-reactive: number of abandoned goals × 3.
    'abandonment-reactive': clamp10(abandonedCount * 3),

    // exploration-heavy: cognition density mean.
    'exploration-heavy': clamp10(assessment.cognitionDensity),

    // defer-resistant: INVERSE of defer rate. High when organism
    // rarely defers despite density.
    'defer-resistant': clamp10(10 - deferPerAct),

    // pressure-resilient: composite — high recovery efficiency AND
    // low fragmentation under high pressure.
    'pressure-resilient': clamp10(
      (assessment.recoveryEfficiency * 0.5) +
      ((10 - assessment.fragmentationRisk) * 0.5),
    ),

    // drift-sensitive: mean drift across goals.
    'drift-sensitive': clamp10(meanDrift),
  };
}

// ─── per-event update ──────────────────────────────────────────

export interface SelfModelUpdateContext {
  at: number;
  tick: number;
}

export function updateSelfModelFromSignal(
  state: SelfModelMemoryState,
  ctx: SelfSignalContext,
  signal: SelfModelUpdateContext,
): SelfModelMemoryState {
  const signals = computeTraitSignals(ctx);
  let traitEvolution = state.traitEvolution;

  const updatedTraits: Trait[] = state.traits.map((trait) => {
    const target = signals[trait.id];
    // EWMA: new intensity = old * (1 - alpha) + target * alpha
    const intensity = round1(clamp10(
      trait.intensity * (1 - TRAIT_EWMA_ALPHA) + target * TRAIT_EWMA_ALPHA,
    ));
    const nextState = nextTraitState(trait.state, intensity);
    const observationCount = trait.observationCount + 1;

    let enteredAt = trait.enteredAt;
    let enteredTick = trait.enteredTick;

    if (nextState !== trait.state) {
      traitEvolution = [...traitEvolution, {
        at: signal.at, tick: signal.tick, traitId: trait.id,
        from: trait.state, to: nextState,
        reason: `intensity ${intensity.toFixed(1)} crossed ${trait.state}→${nextState} band`,
      }];
      // Record entry time for 'forming' or 'active' transitions.
      if (nextState === 'active' || nextState === 'forming') {
        enteredAt = signal.at;
        enteredTick = signal.tick;
      }
    }

    return {
      ...trait,
      intensity, state: nextState, observationCount,
      enteredAt, enteredTick,
    };
  });

  // ─── compute identity metrics ────────────────────────────────

  // Dominant traits — top 3 by intensity, excluding inactive.
  const dominantBehaviorModes = [...updatedTraits]
    .filter((t) => t.state !== 'inactive')
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3)
    .map((t) => t.id);

  // identityCoherence: how clearly identity is defined — count of
  // traits in clearly-defined states (active or fading) normalized.
  // High when many traits are above threshold; low when most inactive.
  const clearTraits = updatedTraits.filter(
    (t) => t.state === 'active' || t.state === 'fading',
  ).length;
  const identityCoherence = round1(clamp10(clearTraits * 1.25 + 2.5));

  // behaviorConsistency: variance of identity coherence across recent
  // snapshots — low variance = high consistency.
  const recentHistory = state.identityHistory.slice(-8);
  let behaviorConsistency = 7;  // baseline if not enough data
  if (recentHistory.length >= 3) {
    const values = recentHistory.map((s) => s.identityCoherence);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    behaviorConsistency = round1(clamp10(10 - Math.sqrt(variance) * 2));
  }

  // selfStability: mean of behaviorConsistency over recent + current.
  const consistencyValues = [
    behaviorConsistency,
    ...state.selfConsistencyHistory.slice(-4).map((c) => c.value),
  ];
  const selfStability = round1(clamp10(
    consistencyValues.reduce((a, b) => a + b, 0) / consistencyValues.length,
  ));

  // ─── instability windows ─────────────────────────────────────

  const systemTension = (() => {
    if (ctx.contradiction.pairs.length === 0) return 0;
    return ctx.contradiction.pairs.reduce(
      (a, p) => a + (p.tensionScore * p.tensionWeight) / 10, 0,
    ) / ctx.contradiction.pairs.length;
  })();
  const fadingTraitCount = updatedTraits.filter((t) => t.state === 'fading').length;
  const isUnstableNow =
    systemTension >= 6 &&
    ctx.os.fragmentationStreak >= 2 &&
    fadingTraitCount >= 2;

  let instabilityWindows = state.instabilityWindows;
  const lastWindow = instabilityWindows.length > 0
    ? instabilityWindows[instabilityWindows.length - 1]
    : null;
  const lastWindowOpen = lastWindow && lastWindow.endAt == null;

  if (isUnstableNow && !lastWindowOpen) {
    // open a new window.
    const dominantPressures = ctx.contradiction.pairs
      .filter((p) => p.tensionScore >= 5)
      .map((p) => p.opposingPressureLabel);
    instabilityWindows = [...instabilityWindows, {
      windowId: `window-${signal.at}-${signal.tick}`,
      startAt: signal.at, startTick: signal.tick,
      dominantPressures,
      peakInstability: round1(systemTension),
    }];
  } else if (lastWindowOpen) {
    // update peak; close if conditions have resolved.
    const updated = { ...lastWindow!, peakInstability: Math.max(lastWindow!.peakInstability, round1(systemTension)) };
    const stillUnstable = systemTension >= 3 || fadingTraitCount >= 1;
    if (!stillUnstable) {
      updated.endAt = signal.at;
      updated.endTick = signal.tick;
      // Determine resolution mechanism from the most recent meaningful event.
      const recentRest = ctx.temporal.recoveryHistory.length > 0
        && (ctx.temporal.recoveryHistory[ctx.temporal.recoveryHistory.length - 1].tick > lastWindow!.startTick);
      const recentDefer = ctx.temporal.deferHistory.length > 0
        && (ctx.temporal.deferHistory[ctx.temporal.deferHistory.length - 1].tick > lastWindow!.startTick);
      const recentResolutions = ctx.contradiction.resolvedTensions.filter(
        (r) => r.tick > lastWindow!.startTick,
      ).length;
      updated.resolutionMechanism =
        recentRest    ? 'recovery via rest' :
        recentDefer   ? 'strategic defer' :
        recentResolutions > 0 ? 'contradiction tension resolved' :
                        'pressure subsided without explicit action';
    }
    instabilityWindows = [...instabilityWindows.slice(0, -1), updated];
  }

  // ─── pattern detection (rule-based, real data only) ──────────

  const persistentPatterns: DetectedPattern[] = [];
  const patternsHere = (id: string, label: string, evidence: string) => {
    persistentPatterns.push({
      patternId: id, label,
      detectedAt: signal.at, detectedTick: signal.tick,
      evidence,
    });
  };

  // 1. stable recovery rhythm — recovery efficiency mean ≥ 7 across ≥ 3 rests.
  if (ctx.temporal.recoveryHistory.length >= 3) {
    const recent = ctx.temporal.recoveryHistory.slice(-6);
    const meanEff = recent.reduce((a, b) => a + b.effectiveness, 0) / recent.length;
    if (meanEff >= 0.7) {
      patternsHere('stable-recovery-rhythm', 'stable recovery rhythm',
        `${recent.length} recent rests at mean effectiveness ${Math.round(meanEff * 100)}%`);
    }
  }

  // 2. recurring cognition bursts — ≥ 2 detected rapid bursts in cadence
  //    (gaps < 2000ms in last 5 acts) over recent history.
  const allGaps = ctx.temporal.cadenceHistory.map((h) => h.interActMs).filter((g): g is number => g != null);
  if (allGaps.length >= 10) {
    const rapidCount = allGaps.slice(-20).filter((g) => g < 2000).length;
    if (rapidCount >= 10) {
      patternsHere('recurring-cognition-bursts', 'recurring cognition bursts',
        `${rapidCount} of last 20 gaps under 2s`);
    }
  }

  // 3. fragmentation after throughput spikes — fragmentationHistory has
  //    peaks AND cognitionDensity is consistently high.
  if (ctx.temporal.fragmentationHistory.length >= 2 && ctx.assessment.cognitionDensity >= 6) {
    patternsHere('fragmentation-after-throughput', 'fragmentation after throughput spikes',
      `${ctx.temporal.fragmentationHistory.length} fragmentation peaks recorded with sustained density ${ctx.assessment.cognitionDensity}/10`);
  }

  // 4. healthy cadence era — cadence health ≥ 7 sustained.
  if (ctx.assessment.cadenceHealth >= 7) {
    patternsHere('healthy-cadence-era', 'healthy cadence era',
      `cadence health ${ctx.assessment.cadenceHealth}/10 with ${ctx.temporal.cadenceHistory.length} cadence observations`);
  }

  // 5. strategic patience maturity — defer count high AND fragmentation low.
  if (ctx.temporal.totalDefers >= 3 && ctx.assessment.fragmentationRisk < 5) {
    patternsHere('strategic-patience-maturity', 'strategic patience maturity',
      `${ctx.temporal.totalDefers} defers in history, fragmentation risk ${ctx.assessment.fragmentationRisk}/10`);
  }

  // 6. chronic contradiction loops — sacrifices ≥ 3 AND systemTension still > 3.
  if (ctx.contradiction.sacrifices.length >= 3 && systemTension > 3) {
    patternsHere('chronic-contradiction', 'chronic contradiction loops',
      `${ctx.contradiction.sacrifices.length} sacrifices recorded with current system tension ${systemTension.toFixed(1)}/10`);
  }

  // ─── identity history snapshot (every Nth event) ─────────────

  const activeTraitIds: TraitId[] = updatedTraits
    .filter((t) => t.state === 'active')
    .map((t) => t.id);
  const snapshot: IdentitySnapshot = {
    at: signal.at, tick: signal.tick,
    identityCoherence, behaviorConsistency, selfStability,
    activeTraitIds,
  };
  const identityHistory = [...state.identityHistory, snapshot];

  // ─── self-consistency observation ─────────────────────────────

  const lastConsistency = state.selfConsistencyHistory.length > 0
    ? state.selfConsistencyHistory[state.selfConsistencyHistory.length - 1].value
    : 7;
  const consistencyDelta = Math.abs(behaviorConsistency - lastConsistency);
  let selfConsistencyHistory = state.selfConsistencyHistory;
  if (consistencyDelta >= TRAIT_HISTORY_DELTA) {
    selfConsistencyHistory = [...selfConsistencyHistory, {
      at: signal.at, tick: signal.tick,
      value: behaviorConsistency,
      delta: round1(behaviorConsistency - lastConsistency),
    }];
  }

  // ─── longitudinal identity score ─────────────────────────────

  const longitudinalIdentityScore = round1((identityCoherence + selfStability) / 2);

  return {
    traits: updatedTraits,
    identityHistory, traitEvolution,
    persistentPatterns,
    instabilityWindows,
    dominantBehaviorModes,
    selfConsistencyHistory,
    longitudinalIdentityScore,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };
}
