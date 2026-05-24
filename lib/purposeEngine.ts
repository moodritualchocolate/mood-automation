/**
 * PURPOSE ENGINE (Wave 31 — Purpose / Intent Layer)
 *
 * Deterministic update of goal scores per cognitive event. The engine
 * is called by cognitionEngine after every verb (except wake-transition).
 *
 * The update logic is RULE-BASED, not learned:
 *   1. For each goal, evaluate align/contradict by the verb's outcome
 *      against the goal's intentType.
 *   2. Apply small deltas to driftScore, alignmentScore, fatigueScore.
 *   3. Recompute derived metrics (coherenceWeight, abandonmentRisk,
 *      pressureScore) from the updated base scores.
 *   4. Apply hysteresis-banded state transitions.
 *   5. Record history entries only when scores moved by ≥ threshold.
 *
 * No randomness. Same inputs → same outputs.
 *
 * Hibernation integration: a separate function applyHibernationDecay
 * is called from the passive-tick path when consciousness is
 * hibernating — slowly cools fatigue on active goals.
 */

import type {
  Goal,
  GoalActivationState,
  GoalIntentType,
  PurposeMemoryState,
  ScoreObservation,
  ActivationTransitionRecord,
} from './purposeMemory';
import { HISTORY_DELTA_THRESHOLD } from './purposeMemory';

// ─── update inputs (signals from cognition) ─────────────────────

export interface CognitiveSignal {
  at: number;
  tick: number;
  directiveName: string;          // e.g. 'observe', 'rest', 'permit-refused'
  isRefusal: boolean;
  /** Wave 26 — non-zero on review with contradictions. */
  contradictionScore: number;
  /** Wave 28 — true if a rest just succeeded. */
  restFired: boolean;
  /** Wave 30 — defer just succeeded. */
  deferFired: boolean;
  /** Wave 30 — fragmentation streak just reset > 0 → 0. */
  fragmentationResolved: boolean;
  /** From temporal assessment computed pre-evolve. */
  cadenceHealth: number;
  recoveryEfficiency: number;
  fragmentationRisk: number;
  cognitionDensity: number;
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── per-goal align / contradict rules ─────────────────────────

/**
 * Returns { alignDelta, driftDelta, fatigueDelta } for a single
 * (goal, signal) pair. The rules are intentional and small —
 * crossing a state threshold requires many sustained events.
 */
function evaluateSignalAgainstGoal(
  goal: Goal,
  s: CognitiveSignal,
): { alignDelta: number; driftDelta: number; fatigueDelta: number } {
  let alignDelta = 0;
  let driftDelta = 0;
  // Every cognitive event slightly fatigues every active/emerging goal.
  let fatigueDelta = goal.activationState === 'dormant'
    || goal.activationState === 'abandoned' ? 0 : 0.05;

  switch (goal.intentType) {
    case 'coherence':
      // any non-refusal verb aligns; any refusal drifts.
      if (!s.isRefusal) alignDelta += 0.15;
      else driftDelta += 0.15;
      // contradiction-found reviews are a real coherence breach.
      if (s.contradictionScore > 0) driftDelta += 0.3 * s.contradictionScore;
      break;
    case 'discipline':
      // reducing fragmentation aligns; refusals (which raise streak) drift.
      if (s.fragmentationResolved) alignDelta += 0.5;
      if (s.isRefusal) driftDelta += 0.25;
      if (s.fragmentationRisk >= 6) driftDelta += 0.15;
      break;
    case 'cadence':
      // cadence health drives this directly.
      if (s.cadenceHealth >= 7) alignDelta += 0.2;
      else if (s.cadenceHealth <= 3) driftDelta += 0.3;
      if (s.cognitionDensity >= 8) driftDelta += 0.15;
      break;
    case 'recovery':
      // rest fires aligns; depletion + no rest drifts.
      if (s.restFired) alignDelta += 0.4;
      if (s.recoveryEfficiency >= 7 && !s.restFired) alignDelta += 0.05;
      if (s.cognitionDensity >= 8 && !s.restFired) driftDelta += 0.2;
      break;
    case 'continuity':
      // defer + sustained patience align; rapid pushes through density drift.
      if (s.deferFired) alignDelta += 0.4;
      if (s.cadenceHealth >= 7) alignDelta += 0.1;
      if (s.cognitionDensity >= 8 && !s.deferFired) driftDelta += 0.2;
      break;
  }
  return { alignDelta, driftDelta, fatigueDelta };
}

// ─── derived metric recomputations ─────────────────────────────

function recomputeDerived(goal: Goal): Goal {
  // coherenceWeight = baseline + alignment − drift, clamped.
  const coherenceWeight = clamp10(round1(5 + (goal.alignmentScore - goal.driftScore) * 0.5));
  // pressureScore = priority × (alignmentScore / 10).
  const pressureScore = clamp10(round1(goal.priority * (goal.alignmentScore / 10)));
  // abandonmentRisk: composite of drift + fatigue + dormancy.
  // Cap at 10. Higher drift + higher fatigue + longer dormancy raises risk.
  const abandonmentRisk = clamp10(round1(
    goal.driftScore * 0.5 + goal.fatigueScore * 0.3,
  ));
  return { ...goal, coherenceWeight, pressureScore, abandonmentRisk };
}

// ─── state transitions with hysteresis ─────────────────────────

/**
 * Applies activation-state transitions. Hysteresis bands prevent
 * oscillation: e.g., active → fragmented requires drift ≥ 7, but
 * fragmented → active requires drift dropping below 4 AND alignment
 * ≥ 5. No instant flips on edge values.
 *
 * Returns the updated goal AND optional transition record if a
 * transition happened.
 */
function applyTransitions(
  goal: Goal,
  currentTick: number,
  at: number,
): { goal: Goal; transition: ActivationTransitionRecord | null } {
  const from = goal.activationState;
  let to: GoalActivationState = from;
  let reason = '';

  const ticksSinceRelevant = goal.lastRelevantTick > 0
    ? currentTick - goal.lastRelevantTick
    : 0;

  if (from === 'emerging') {
    if (goal.alignmentScore >= 5 && goal.driftScore < 5) {
      to = 'active';
      reason = `alignmentScore ${goal.alignmentScore.toFixed(1)} ≥ 5, driftScore ${goal.driftScore.toFixed(1)} < 5`;
    }
  } else if (from === 'active') {
    if (goal.driftScore >= 7) {
      to = 'fragmented';
      reason = `driftScore ${goal.driftScore.toFixed(1)} ≥ 7`;
    } else if (ticksSinceRelevant >= 50) {
      to = 'dormant';
      reason = `${ticksSinceRelevant} ticks without relevant cognition`;
    }
  } else if (from === 'fragmented') {
    if (goal.abandonmentRisk >= 8) {
      to = 'abandoned';
      reason = `abandonmentRisk ${goal.abandonmentRisk.toFixed(1)} ≥ 8`;
    } else if (goal.driftScore < 4 && goal.alignmentScore >= 5) {
      to = 'active';
      reason = `driftScore ${goal.driftScore.toFixed(1)} < 4 AND alignmentScore ${goal.alignmentScore.toFixed(1)} ≥ 5`;
    }
  } else if (from === 'dormant') {
    if (goal.alignmentScore >= 5 && ticksSinceRelevant === 0) {
      to = 'active';
      reason = `re-engaged: alignmentScore ${goal.alignmentScore.toFixed(1)} ≥ 5 after dormancy`;
    }
  }
  // 'abandoned' and 'resolved' are terminal (for Wave 31). No outgoing
  // transitions defined.

  if (to === from) {
    return { goal, transition: null };
  }
  const updated: Goal = {
    ...goal,
    activationState: to,
    lastActivatedAt: to === 'active' ? at : goal.lastActivatedAt,
  };
  const transition: ActivationTransitionRecord = {
    at, tick: currentTick,
    goalId: goal.id, goalTitle: goal.title,
    from, to, reason,
  };
  return { goal: updated, transition };
}

// ─── score history (only when delta ≥ threshold) ───────────────

function recordIfChanged(
  history: ScoreObservation[],
  goalId: string,
  oldVal: number,
  newVal: number,
  at: number,
  tick: number,
): ScoreObservation[] {
  const delta = newVal - oldVal;
  if (Math.abs(delta) < HISTORY_DELTA_THRESHOLD) return history;
  return [...history, { at, tick, goalId, value: round1(newVal), delta: round1(delta) }];
}

// ─── primary update function ───────────────────────────────────

export function updatePurposeFromSignal(
  state: PurposeMemoryState,
  signal: CognitiveSignal,
): PurposeMemoryState {
  let driftHistory = state.driftHistory;
  let alignmentHistory = state.alignmentHistory;
  let fatigueHistory = state.fatigueHistory;
  let activationTransitions = state.activationTransitions;
  let activeCount = 0, fragmentedCount = 0, dormantCount = 0, abandonedCount = 0;

  const updatedGoals: Goal[] = state.goals.map((goal) => {
    const { alignDelta, driftDelta, fatigueDelta } = evaluateSignalAgainstGoal(goal, signal);
    // Rest reduces fatigue for all active/emerging goals (a global recovery effect).
    const restFatigueRelief = signal.restFired ? -0.4 : 0;
    // Gentle drift down on goals not touched (drift fades over time).
    const driftDecay = alignDelta > 0 ? -0.05 : 0;

    const newDrift = clamp10(round1(goal.driftScore + driftDelta + driftDecay));
    const newAlign = clamp10(round1(goal.alignmentScore + alignDelta));
    const newFatigue = clamp10(round1(goal.fatigueScore + fatigueDelta + restFatigueRelief));
    const relevant = alignDelta !== 0 || driftDelta !== 0;
    const lastRelevantTick = relevant ? signal.tick : goal.lastRelevantTick;

    driftHistory = recordIfChanged(driftHistory, goal.id, goal.driftScore, newDrift, signal.at, signal.tick);
    alignmentHistory = recordIfChanged(alignmentHistory, goal.id, goal.alignmentScore, newAlign, signal.at, signal.tick);
    fatigueHistory = recordIfChanged(fatigueHistory, goal.id, goal.fatigueScore, newFatigue, signal.at, signal.tick);

    let next: Goal = { ...goal,
      driftScore: newDrift,
      alignmentScore: newAlign,
      fatigueScore: newFatigue,
      lastRelevantTick,
    };
    next = recomputeDerived(next);
    const transitioned = applyTransitions(next, signal.tick, signal.at);
    next = transitioned.goal;
    if (transitioned.transition) {
      activationTransitions = [...activationTransitions, transitioned.transition];
    }

    if (next.activationState === 'active') activeCount++;
    else if (next.activationState === 'fragmented') fragmentedCount++;
    else if (next.activationState === 'dormant') dormantCount++;
    else if (next.activationState === 'abandoned') abandonedCount++;

    return next;
  });

  const goalSnapshotHistory = [
    ...state.goalSnapshotHistory,
    { at: signal.at, tick: signal.tick, activeCount, fragmentedCount, dormantCount, abandonedCount },
  ];

  return {
    goals: updatedGoals,
    activationTransitions,
    driftHistory,
    alignmentHistory,
    fatigueHistory,
    goalSnapshotHistory,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    lastUpdatedAt: signal.at,
  };
}

/**
 * Hibernation slow-decay: tiny fatigue reduction across active goals.
 * Called from the passive-tick path when consciousness === 'hibernating'.
 * Returns null when no change (so the caller skips a write).
 */
export function applyHibernationDecay(
  state: PurposeMemoryState,
  at: number,
  tick: number,
): PurposeMemoryState | null {
  let changed = false;
  const updatedGoals = state.goals.map((goal) => {
    if (goal.activationState !== 'active' && goal.activationState !== 'emerging') return goal;
    if (goal.fatigueScore <= 0) return goal;
    const next = clamp10(round1(goal.fatigueScore - 0.1));
    if (next === goal.fatigueScore) return goal;
    changed = true;
    return recomputeDerived({ ...goal, fatigueScore: next });
  });
  if (!changed) return null;
  return { ...state, goals: updatedGoals, totalUpdates: state.totalUpdates + 1, lastUpdatedAt: at };
}
