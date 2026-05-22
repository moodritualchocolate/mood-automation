/**
 * COLLAPSE PROBABILITY (Phase 24)
 *
 * Estimates how close the subject is to a FUNCTIONAL collapse — not
 * a cinematic breakdown (the spec explicitly forbids that), but the
 * quiet kind: the day a high-functioning person simply cannot
 * produce the output, calls in, goes quiet, or stops.
 *
 * The probability is read from the campaign trail (how long the
 * subject has been running at deficit) plus the current state.
 * A high probability does NOT mean the banner should depict
 * collapse — it means the banner should depict the LAST STABLE
 * MOMENT before it.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';

export type CollapseHorizon = 'not-near' | 'gathering' | 'near' | 'imminent';

export interface CollapseProbabilityReading {
  horizon: CollapseHorizon;
  /** 0..10 — probability estimate. */
  probability: number;
  /** Count of consecutive deficit-family banners in the trail. */
  deficit_streak: number;
  /** True when the banner depicts collapse itself rather than the
   *  last stable moment before it. */
  depicts_collapse_directly: boolean;
  notes: string[];
}

export interface CollapseProbabilityInput {
  state: HumanState;
  truth: HumanTruth;
  recentTrail: EmotionalTraceEntry[];
}

const DEFICIT_FAMILIES = new Set(['fatigue', 'collapse', 'numbness', 'pressure', 'paralysis']);
const DIRECT_COLLAPSE = /\b(broke down|fell apart|collapsed|couldn[' ]?t get up|burst into tears|screamed|shut down completely)\b/i;

export function readCollapseProbability(input: CollapseProbabilityInput): CollapseProbabilityReading {
  const { state, truth, recentTrail } = input;
  const notes: string[] = [];

  // Count the consecutive deficit-family streak from the most recent.
  let deficit_streak = 0;
  for (const t of recentTrail) {
    if (DEFICIT_FAMILIES.has(t.family)) deficit_streak += 1;
    else break;
  }
  if (DEFICIT_FAMILIES.has(state.family)) deficit_streak += 1;

  let probability = 0;
  if (DEFICIT_FAMILIES.has(state.family)) probability += 3;
  probability += Math.min(5, deficit_streak * 1.2);
  if (state.family === 'collapse') probability += 2;
  probability = Math.max(0, Math.min(10, probability));

  const horizon: CollapseHorizon =
    probability >= 8 ? 'imminent' :
    probability >= 6 ? 'near' :
    probability >= 3 ? 'gathering' : 'not-near';

  const depicts_collapse_directly = DIRECT_COLLAPSE.test(truth.truth);

  notes.push(`collapse probability: ${probability}/10 (${horizon}) — deficit streak ${deficit_streak}`);
  if (depicts_collapse_directly) {
    notes.push('WARNING: banner depicts collapse directly — Phase 24 wants the LAST STABLE MOMENT before it, not the collapse');
  }
  return { horizon, probability, deficit_streak, depicts_collapse_directly, notes };
}
