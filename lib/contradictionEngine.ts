/**
 * CONTRADICTION ENGINE (Wave 32)
 *
 * Pure deterministic pressure physics. The engine reads the current
 * temporal/organism/os state and the post-update purpose state,
 * produces:
 *   - the updated ContradictionMemoryState
 *   - a list of SacrificeApplication objects (mutations to apply to
 *     purpose state — goal activation downgrades when contradiction
 *     sustained above threshold)
 *
 * No randomness. Same inputs → same outputs. The five seeded pairs
 * are the entire topology — no new pairs are invented, no narratives
 * are composed beyond label-substitution into deterministic strings.
 */

import type {
  ContradictionMemoryState,
  TensionPair,
  ContradictionEvent,
  SacrificeEvent,
  ResolvedTensionEvent,
  OpposingPressureId,
} from './contradictionMemory';
import type { Goal } from './purposeMemory';
import type { OSRuntimeState } from './operatingSystemCore';
import type { OrganismVitalState } from './persistentOrganismCore';
import type { TemporalAssessment } from './temporalIntelligenceView';

// ─── thresholds / hysteresis bands ─────────────────────────────

/** Tension rises when opposing pressure is at or above this. */
export const ESCALATION_PRESSURE_THRESHOLD = 6;
/** Tension falls only when opposing pressure is at or below this. */
export const RECOVERY_PRESSURE_THRESHOLD = 3;
/** sustainedHighCount required to trigger sacrifice. */
export const SACRIFICE_THRESHOLD_UPDATES = 3;
/** tensionScore at or above this counts as "high" for sustained count. */
export const TENSION_HIGH_THRESHOLD = 8;
/** tensionScore must drop below this to record a resolution event. */
export const RESOLUTION_THRESHOLD = 2;

// ─── pressure computation (deterministic from real state) ─────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/**
 * Map current state to the five opposing-pressure levels. Each is
 * a real measurement of how strongly the corresponding tension's
 * adversary force is pushing right now. All 0..10.
 */
export function computePressureLevels(
  temporal: TemporalAssessment,
  os: OSRuntimeState,
  _organism: OrganismVitalState,
): Record<OpposingPressureId, number> {
  // 1. cognition-throughput: raw cognitionDensity from temporal.
  const cognitionThroughput = clamp10(temporal.cognitionDensity);

  // 2. sustained-rapid-cognition: density × (1 - recoveryEfficiency/10).
  //    Higher when recovery is weak AND cognition is dense.
  const sustainedRapid = clamp10(
    temporal.cognitionDensity * (1 - temporal.recoveryEfficiency / 10),
  );

  // 3. high-exploration-density: max of cognitionDensity and (10 - cadenceHealth).
  //    A bursty rhythm shows up either way.
  const explorationDensity = clamp10(Math.max(
    temporal.cognitionDensity,
    10 - temporal.cadenceHealth,
  ));

  // 4. fragmentation-escalation: max of fragmentationRisk and
  //    fragmentationStreak * 2 (so an active streak escalates immediately).
  const fragmentationEsc = clamp10(Math.max(
    temporal.fragmentationRisk,
    os.fragmentationStreak * 2,
  ));

  // 5. aggressive-throughput: weighted combination of density and low cadence.
  const aggressiveThroughput = clamp10(
    (temporal.cognitionDensity + (10 - temporal.cadenceHealth)) / 2,
  );

  return {
    'cognition-throughput': round1(cognitionThroughput),
    'sustained-rapid-cognition': round1(sustainedRapid),
    'high-exploration-density': round1(explorationDensity),
    'fragmentation-escalation': round1(fragmentationEsc),
    'aggressive-throughput': round1(aggressiveThroughput),
  };
}

// ─── sacrifice application ─────────────────────────────────────

export interface SacrificeApplication {
  goalId: string;
  goalTitle: string;
  fromState: string;
  toState: string;
  pairId: string;
  tensionAtSacrifice: number;
  opposingPressureLabel: string;
}

function sacrificeNextState(currentState: string): string | null {
  if (currentState === 'active')     return 'fragmented';
  if (currentState === 'emerging')   return 'dormant';
  if (currentState === 'fragmented') return 'abandoned';
  return null; // 'dormant', 'abandoned', 'resolved' — terminal for sacrifice
}

// ─── main update function ──────────────────────────────────────

export function updateContradictionFromSignal(
  state: ContradictionMemoryState,
  goals: Goal[],
  temporal: TemporalAssessment,
  os: OSRuntimeState,
  organism: OrganismVitalState,
  signal: { at: number; tick: number },
): { newState: ContradictionMemoryState; sacrifices: SacrificeApplication[] } {
  const pressureLevels = computePressureLevels(temporal, os, organism);

  let contradictionHistory = state.contradictionHistory;
  let resolvedTensions = state.resolvedTensions;
  let sacrifices = state.sacrifices;
  const contradictionCountsByGoal: Record<string, number> = { ...state.contradictionCountsByGoal };
  let cumulativeSystemTension = state.cumulativeSystemTension;
  let lastResolutionAt = state.lastResolutionAt;

  const sacrificeApplications: SacrificeApplication[] = [];

  const updatedPairs: TensionPair[] = state.pairs.map((pair) => {
    const pressure = pressureLevels[pair.opposingPressureId] ?? 0;
    const goal = goals.find((g) => g.id === pair.goalAId);
    const goalAvailable = !!goal &&
      (goal.activationState === 'active' || goal.activationState === 'emerging');

    let newTension = pair.tensionScore;
    let cause: ContradictionEvent['cause'] | null = null;

    if (goalAvailable && pressure >= ESCALATION_PRESSURE_THRESHOLD) {
      // escalate — scaled by how strongly pressure exceeds threshold.
      const escalationFactor = pressure / 10;
      newTension = clamp10(round1(pair.tensionScore + pair.escalationRate * escalationFactor));
      cause = 'escalation';
    } else if (pressure <= RECOVERY_PRESSURE_THRESHOLD && pair.tensionScore > 0) {
      // recovery — gentle, only when pressure has truly subsided.
      newTension = clamp10(round1(pair.tensionScore - pair.recoveryRate));
      cause = 'recovery';
    } else if (!goalAvailable && pair.tensionScore > 0) {
      // goal is dormant/abandoned/resolved — tension fades because nothing
      // is pulling against the pressure anymore.
      newTension = clamp10(round1(pair.tensionScore - pair.recoveryRate * 1.5));
      cause = 'recovery';
    }

    const delta = newTension - pair.tensionScore;
    if (delta > 0) cumulativeSystemTension = round1(cumulativeSystemTension + delta);

    // record history only on meaningful change.
    if (cause && Math.abs(delta) >= 0.3) {
      contradictionHistory = [
        ...contradictionHistory,
        {
          at: signal.at, tick: signal.tick, pairId: pair.pairId,
          tensionScore: newTension, delta: round1(delta), cause,
        },
      ];
      contradictionCountsByGoal[pair.goalAId] =
        (contradictionCountsByGoal[pair.goalAId] ?? 0) + 1;
    }

    // sustained-high tracking.
    const newSustainedHigh = newTension >= TENSION_HIGH_THRESHOLD
      ? pair.sustainedHighCount + 1
      : (newTension < 6 ? 0 : pair.sustainedHighCount);

    // Record resolution when tension crosses the RESOLUTION_THRESHOLD
    // downward AND the pair had reached real elevation at some point
    // (peakTension > 5). The crossing-event check (was ≥ 2, now < 2)
    // ensures one resolution event per cycle, not one per low-tension
    // step. peakTension > 5 ensures we only mark resolutions for
    // tensions that were ever meaningfully high.
    if (
      pair.tensionScore >= RESOLUTION_THRESHOLD &&
      newTension < RESOLUTION_THRESHOLD &&
      pair.peakTension > 5
    ) {
      resolvedTensions = [
        ...resolvedTensions,
        {
          at: signal.at, tick: signal.tick, pairId: pair.pairId,
          finalScore: newTension, resolvedFromPeak: pair.peakTension,
        },
      ];
      lastResolutionAt = signal.at;
    }

    // Sacrifice check — only on sustained high AND goal still available.
    let workingPair: TensionPair = {
      ...pair,
      tensionScore: newTension,
      peakTension: Math.max(pair.peakTension, newTension),
      sustainedHighCount: newSustainedHigh,
      lastUpdateAt: signal.at,
      lastUpdateTick: signal.tick,
    };

    if (newSustainedHigh >= SACRIFICE_THRESHOLD_UPDATES && goal) {
      const next = sacrificeNextState(goal.activationState);
      if (next) {
        const sac: SacrificeEvent = {
          at: signal.at, tick: signal.tick,
          goalId: goal.id, goalTitle: goal.title,
          from: goal.activationState, to: next,
          pairId: pair.pairId,
          tensionAtSacrifice: newTension,
          opposingPressureLabel: pair.opposingPressureLabel,
        };
        sacrifices = [...sacrifices, sac];
        sacrificeApplications.push({
          goalId: goal.id, goalTitle: goal.title,
          fromState: goal.activationState, toState: next,
          pairId: pair.pairId,
          tensionAtSacrifice: newTension,
          opposingPressureLabel: pair.opposingPressureLabel,
        });
        // partial resolution after sacrifice.
        workingPair = {
          ...workingPair,
          tensionScore: clamp10(round1(newTension - 2)),
          sustainedHighCount: 0,
        };
        contradictionHistory = [
          ...contradictionHistory,
          {
            at: signal.at, tick: signal.tick, pairId: pair.pairId,
            tensionScore: workingPair.tensionScore,
            delta: round1(workingPair.tensionScore - newTension),
            cause: 'sacrifice-resolution',
          },
        ];
      }
    }

    return workingPair;
  });

  const newState: ContradictionMemoryState = {
    pairs: updatedPairs,
    contradictionHistory,
    resolvedTensions,
    sacrifices,
    contradictionCountsByGoal,
    cumulativeSystemTension,
    lastResolutionAt,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };

  return { newState, sacrifices: sacrificeApplications };
}

// ─── apply sacrifices to purpose memory ────────────────────────

import type { PurposeMemoryState, ActivationTransitionRecord, GoalActivationState } from './purposeMemory';

/**
 * Apply each sacrifice to the purpose-memory state: change the
 * goal's activationState AND append an ActivationTransitionRecord
 * so Wave 31's transition log shows the contradiction-induced
 * change uniformly with all other transitions.
 */
export function applySacrificesToPurpose(
  purpose: PurposeMemoryState,
  sacrifices: SacrificeApplication[],
  at: number, tick: number,
): PurposeMemoryState {
  if (sacrifices.length === 0) return purpose;

  const sacrificeByGoalId = new Map<string, SacrificeApplication>();
  for (const s of sacrifices) sacrificeByGoalId.set(s.goalId, s);

  const newTransitions: ActivationTransitionRecord[] = [];
  const updatedGoals = purpose.goals.map((goal) => {
    const sac = sacrificeByGoalId.get(goal.id);
    if (!sac) return goal;
    if (goal.activationState !== sac.fromState) return goal;  // race-safety
    const to = sac.toState as GoalActivationState;
    newTransitions.push({
      at, tick,
      goalId: goal.id, goalTitle: goal.title,
      from: sac.fromState as GoalActivationState, to,
      reason: `contradiction sacrifice — tension ${sac.tensionAtSacrifice.toFixed(1)}/10 against '${sac.opposingPressureLabel}'`,
    });
    // Wave 32 fix — bump driftScore to 7 so the purpose engine's natural
    // fragmented → active transition (which needs drift < 4 AND alignment ≥ 5)
    // cannot fire immediately. Without this, a sacrificed goal would
    // re-activate on the very next event and immediately be sacrificed
    // again — oscillation. The drift bump represents the real cost of
    // having been demoted by contradiction.
    return {
      ...goal,
      activationState: to,
      driftScore: Math.max(goal.driftScore, 7),
    };
  });

  return {
    ...purpose,
    goals: updatedGoals,
    activationTransitions: [...purpose.activationTransitions, ...newTransitions],
    totalUpdates: purpose.totalUpdates + 1,
    lastUpdatedAt: at,
  };
}
