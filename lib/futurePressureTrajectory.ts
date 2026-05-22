/**
 * FUTURE PRESSURE TRAJECTORY (Phase 24)
 *
 * Projects the subject's PRESSURE LOAD forward — is the load about
 * to rise, plateau, or (rarely) ease? Reads the calendar-shape
 * implied by the state plus the campaign trail's pressure history.
 *
 * Modern pressure trajectories almost never ease. The engine refuses
 * banners predicting a clean downward trajectory unless the truth
 * has earned it.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';

export type PressureTrajectory = 'rising' | 'plateau-high' | 'plateau-low' | 'easing' | 'volatile';

export interface FuturePressureTrajectoryReading {
  trajectory: PressureTrajectory;
  /** 0..10 — projected pressure level at the next horizon. */
  projected_load: number;
  /** A short description of the next pressure event on the horizon. */
  next_pressure_event: string;
  notes: string[];
}

export interface FuturePressureTrajectoryInput {
  state: HumanState;
  truth: HumanTruth;
  recentTrail: EmotionalTraceEntry[];
}

const PRESSURE_FAMILIES = new Set(['pressure', 'overstimulation', 'collapse']);

const STATE_TO_NEXT_EVENT: Record<string, string> = {
  'sunday-anxiety':                  'the week opens in a few hours — the load is already visible',
  'before-meeting-panic':            'the meeting is minutes away',
  'overwhelmed-founder':             'the next board update / payroll / decision is already on the calendar',
  'startup-burnout':                 'the runway math does not change next month',
  'unread-messages-anxiety':         'the unanswered messages compound overnight',
  'parent-overload':                 'tomorrow is structurally identical to today',
  'always-on-anxiety':               'there is no scheduled point where the availability ends',
};

export function readFuturePressureTrajectory(input: FuturePressureTrajectoryInput): FuturePressureTrajectoryReading {
  const { state, recentTrail } = input;
  const notes: string[] = [];

  const recentPressure = recentTrail.slice(0, 8).filter((t) => PRESSURE_FAMILIES.has(t.family)).length;
  const isPressureNow = PRESSURE_FAMILIES.has(state.family);

  let trajectory: PressureTrajectory;
  if (isPressureNow && recentPressure >= 5) trajectory = 'plateau-high';
  else if (isPressureNow && recentPressure >= 2) trajectory = 'rising';
  else if (isPressureNow) trajectory = 'rising';
  else if (recentPressure >= 4) trajectory = 'volatile';
  else trajectory = 'plateau-low';

  let projected_load = isPressureNow ? 7 : 4;
  projected_load += Math.min(3, recentPressure * 0.5);
  projected_load = Math.min(10, projected_load);

  const next_pressure_event = STATE_TO_NEXT_EVENT[state.id] ?? 'no specific pressure event on the visible horizon';

  notes.push(`future pressure trajectory: ${trajectory} (projected load ${projected_load.toFixed(1)}/10)`);
  notes.push(`next pressure event: ${next_pressure_event}`);
  return { trajectory, projected_load, next_pressure_event, notes };
}
