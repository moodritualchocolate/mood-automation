/**
 * LIFE TRAJECTORY (Phase 26 — Unified Cognitive Field)
 *
 * Understands where a human state is MOVING. Not what the person
 * feels now — what happens if this continues.
 *
 * Phase 24 produced separate predictive readings (forecast, behavior
 * prediction, collapse probability, recovery attempt, pressure
 * trajectory, drift). Phase 26 does not add new prediction — it
 * UNIFIES those into a single forward trajectory the campaign can be
 * built against. The system generates creative from the trajectory,
 * not from the snapshot.
 */

import type { EmotionalForecastReading } from './emotionalForecasting';
import type { BehaviorPredictionReading } from './behaviorPrediction';
import type { CollapseProbabilityReading } from './collapseProbability';
import type { RecoveryAttemptReading } from './recoveryAttemptModel';
import type { FuturePressureTrajectoryReading } from './futurePressureTrajectory';
import type { EmotionalDriftPredictionReading } from './emotionalDriftPrediction';

export interface LifeTrajectoryReading {
  /** The unified next-step description. */
  next_likely_behavior: string;
  next_coping_loop: string;
  next_pressure_change: string;
  likely_masking_response: string;
  likely_desire_shift: string;
  likely_ritual_formation: string;
  likely_emotional_residue: string;
  likely_collapse_point: string;
  likely_recovery_attempt: string;
  /** 0..10 — how coherent the unified trajectory is. */
  trajectory_coherence: number;
  /** 0..10 — how inevitable the trajectory reads. */
  trajectory_inevitability: number;
  /** A single sentence: where this human is going. */
  trajectory_statement: string;
  notes: string[];
}

export interface LifeTrajectoryInput {
  forecast: EmotionalForecastReading;
  behaviorPrediction: BehaviorPredictionReading;
  collapseProbability: CollapseProbabilityReading;
  recoveryAttempt: RecoveryAttemptReading;
  pressureTrajectory: FuturePressureTrajectoryReading;
  drift: EmotionalDriftPredictionReading;
}

export function projectLifeTrajectory(input: LifeTrajectoryInput): LifeTrajectoryReading {
  const { forecast, behaviorPrediction, collapseProbability, recoveryAttempt, pressureTrajectory, drift } = input;
  const notes: string[] = [];

  const next_likely_behavior = behaviorPrediction.primary?.the_act ?? 'no specific next behavior projected';
  const next_coping_loop = behaviorPrediction.secondary?.the_act
    ?? behaviorPrediction.primary?.the_act
    ?? 'the coping loop has not formed a clear next cycle';
  const next_pressure_change = `${pressureTrajectory.trajectory} — ${pressureTrajectory.next_pressure_event}`;
  const likely_masking_response = pressureTrajectory.projected_load >= 7
    ? 'masking will intensify as the load rises'
    : 'masking will hold at its current level';
  const likely_desire_shift = drift.vector === 'baseline-eroding' || drift.vector === 'baseline-numbing'
    ? 'desire will narrow toward permission-to-stop and unobserved existence'
    : 'desire will hold its current shape';
  const likely_ritual_formation = 'a compensation ritual will deepen toward stabilisation';
  const likely_emotional_residue = forecast.direction === 'quiet-erosion' || drift.vector === 'baseline-eroding'
    ? 'residue will accumulate faster than it clears'
    : 'residue will stay roughly level';
  const likely_collapse_point = collapseProbability.horizon === 'not-near'
    ? 'no functional collapse on the visible horizon'
    : `functional collapse is ${collapseProbability.horizon} (${collapseProbability.probability}/10)`;
  const likely_recovery_attempt = recoveryAttempt.primary
    ? `${recoveryAttempt.primary.the_attempt} → likely ${recoveryAttempt.primary.most_likely_outcome}`
    : 'no recovery attempt projected';

  // Coherence: the sub-predictions agree when forecast + drift + collapse
  // point the same direction.
  let trajectory_coherence = 5;
  const worsening = (forecast.direction === 'quiet-erosion' || forecast.direction === 'slow-drift-to-numbness'
    || forecast.direction === 'escalation-to-overwhelm');
  const driftWorsening = drift.vector === 'baseline-eroding' || drift.vector === 'baseline-numbing';
  if (worsening && driftWorsening) trajectory_coherence += 2.5;
  if (collapseProbability.probability >= 6 && worsening) trajectory_coherence += 1.5;
  if (forecast.forecast_confidence >= 6) trajectory_coherence += 1;
  trajectory_coherence = clamp10(round1(trajectory_coherence));

  // Inevitability inherits the forecast's, dampened if the forecast
  // resolved too cleanly.
  let trajectory_inevitability = forecast.inevitability;
  if (recoveryAttempt.recovery_too_inspirational) trajectory_inevitability = Math.max(0, trajectory_inevitability - 3);
  if (collapseProbability.depicts_collapse_directly) trajectory_inevitability = Math.max(0, trajectory_inevitability - 2);
  trajectory_inevitability = clamp10(round1(trajectory_inevitability));

  const trajectory_statement =
    `if nothing changes: ${forecast.direction.replace(/-/g, ' ')}, ` +
    `${next_likely_behavior.toLowerCase()}, and ${likely_collapse_point.toLowerCase()}`;

  notes.push(`life trajectory: ${trajectory_statement}`);
  notes.push(`coherence ${trajectory_coherence}/10 · inevitability ${trajectory_inevitability}/10`);

  return {
    next_likely_behavior, next_coping_loop, next_pressure_change,
    likely_masking_response, likely_desire_shift, likely_ritual_formation,
    likely_emotional_residue, likely_collapse_point, likely_recovery_attempt,
    trajectory_coherence, trajectory_inevitability, trajectory_statement, notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
