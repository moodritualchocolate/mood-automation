/**
 * AUTONOMOUS LONG-TERM PLANNING (Phase 68 — Wave 6: Cognitive Civilization)
 *
 * The civilization plans beyond the next banner. From its
 * institutional memory, its beliefs, its cultural drift, and its
 * scars, it forms a long-horizon strategic intention — what the
 * campaign should become over the coming generations.
 */

import type { CivilizationState } from './civilizationArchive';
import type { CulturalDriftReading } from './culturalDriftEngine';
import type { ScarMemoryReading } from './psychologicalScarMemory';

export interface LongTermPlanReading {
  /** The civilization's long-horizon strategic intention. */
  long_term_intention: string;
  /** The single most important thing to protect over the long term. */
  protect: string;
  /** The single most important thing to evolve over the long term. */
  evolve: string;
  /** 0..10 — how clear the long-term plan is. */
  plan_clarity: number;
  notes: string[];
}

export interface LongTermPlanInput {
  state: CivilizationState;
  drift: CulturalDriftReading;
  scars: ScarMemoryReading;
}

export function planAutonomousLongTerm(input: LongTermPlanInput): LongTermPlanReading {
  const { state, drift, scars } = input;
  const notes: string[] = [];

  let long_term_intention: string;
  let protect: string;
  let evolve: string;

  if (drift.drift_is_narrowing) {
    long_term_intention = 'over the coming generations the civilization must widen its emotional range before its culture becomes a monoculture';
    protect = 'the remaining diversity of governing priorities';
    evolve = `away from the over-dominant centre "${drift.cultural_centre}"`;
  } else if (scars.active_scars.length >= 3) {
    long_term_intention = 'the civilization carries several unhealed scars — the long-term plan is to let them heal and not reopen the territories that wounded it';
    protect = 'the caution the scars have taught';
    evolve = 'toward territories the civilization has not been wounded in';
  } else if (state.optimizationWins > state.identityWins) {
    long_term_intention = 'optimization has been winning over identity — the long-term plan is to deliberately rebalance toward identity before the civilization decays';
    protect = 'the brand identity above all metrics';
    evolve = 'a discipline of refusing optimization-driven decisions';
  } else {
    long_term_intention = 'the civilization is stable — the long-term plan is to deepen its proven beliefs and let the campaign mature into something timeless';
    protect = state.beliefs[0]?.statement ?? 'the campaign\'s founding truth';
    evolve = 'the depth, not the breadth, of the campaign';
  }

  const plan_clarity = round1(Math.min(10,
    3 + Math.min(4, state.institutionalMemory.length / 4) + (state.beliefs.length >= 1 ? 2 : 0)
    + (drift.cultural_centre ? 1 : 0)));

  notes.push(`autonomous long-term planning: ${long_term_intention}`);
  notes.push(`long-term plan: protect "${protect}"; evolve "${evolve}"`);

  return { long_term_intention, protect, evolve, plan_clarity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
