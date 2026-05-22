/**
 * REPEATED COMFORT SYSTEMS (Phase 22)
 *
 * The set of small comfort behaviors a subject cycles through across
 * a week — not one ritual, but a SYSTEM of interchangeable comforts
 * the body rotates between. The tea, the show, the bath, the call to
 * a specific friend, the specific food.
 *
 * The engine reads how DIVERSE vs NARROW the comfort system is. A
 * narrow comfort system (one comfort, used constantly) is a fragility
 * signal — the body has only one regulator left. A diverse comfort
 * system is healthier but less cinematically sharp.
 *
 * The meta-critic uses this to ask: does the banner's comfort feel
 * EMOTIONALLY NECESSARY, or optimised / branded / designed?
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type ComfortBehaviorId =
  | 'specific-warm-drink'
  | 'rewatched-familiar-show'
  | 'long-bath-or-shower'
  | 'call-to-one-specific-person'
  | 'specific-comfort-food'
  | 'a-known-walk-route'
  | 'a-particular-blanket'
  | 'one-game-on-the-phone';

export interface ComfortBehaviorRecord {
  id: ComfortBehaviorId;
  the_comfort: string;
  emotional_function: string;
}

export const COMFORT_LIBRARY: Record<ComfortBehaviorId, ComfortBehaviorRecord> = {
  'specific-warm-drink':       { id: 'specific-warm-drink',       the_comfort: 'a specific warm drink made the same way',                emotional_function: 'a small reliable sensory floor under a bad day' },
  'rewatched-familiar-show':   { id: 'rewatched-familiar-show',   the_comfort: 'a show already seen, put on for the third time',          emotional_function: 'narrative with zero cognitive risk' },
  'long-bath-or-shower':       { id: 'long-bath-or-shower',       the_comfort: 'a long bath or shower past hygiene need',                 emotional_function: 'a sanctioned enclosure nobody can enter' },
  'call-to-one-specific-person':{ id: 'call-to-one-specific-person',the_comfort: 'a call to the one person who requires no preamble',     emotional_function: 'company without the cost of being caught up' },
  'specific-comfort-food':     { id: 'specific-comfort-food',     the_comfort: 'a specific food eaten for state, not hunger',             emotional_function: 'a fast, dependable small pleasure' },
  'a-known-walk-route':        { id: 'a-known-walk-route',        the_comfort: 'a walk on a route the body already knows',                emotional_function: 'movement without decisions' },
  'a-particular-blanket':      { id: 'a-particular-blanket',      the_comfort: 'a particular blanket, used in a particular spot',         emotional_function: 'a physical boundary the body recognises as safe' },
  'one-game-on-the-phone':     { id: 'one-game-on-the-phone',     the_comfort: 'one low-stakes game played in small windows',             emotional_function: 'an attention-anchor that asks nothing back' },
};

const STATE_TO_COMFORT: Record<string, ComfortBehaviorId[]> = {
  'silent-burnout':                  ['specific-warm-drink', 'rewatched-familiar-show'],
  'restless-night':                  ['rewatched-familiar-show', 'one-game-on-the-phone'],
  'emotionally-drained':             ['call-to-one-specific-person', 'a-particular-blanket'],
  'late-kitchen-silence':            ['specific-warm-drink', 'specific-comfort-food'],
  'overwhelmed-founder':             ['a-known-walk-route'],
  'sunday-anxiety':                  ['rewatched-familiar-show', 'long-bath-or-shower'],
  'parent-overload':                 ['long-bath-or-shower', 'specific-comfort-food'],
  'partner-overload':                ['a-known-walk-route'],
  'low-battery-feeling':             ['a-particular-blanket', 'rewatched-familiar-show'],
};

const BRANDED_COMFORT = /\b(brand|product|sponsored|the new|launch|limited edition|must[- ]have|treat yourself)\b/i;
const OPTIMISED_COMFORT = /\b(optimi[sz]ed?|protocol|routine designed|stack|hack|biohack|perfected)\b/i;

export interface RepeatedComfortSystemsReading {
  primary: ComfortBehaviorRecord | null;
  /** Distinct comforts the state implies — proxy for diversity. */
  comfort_diversity: number;
  /** True when the comfort system reads as narrow (one regulator). */
  narrow_comfort_fragility: boolean;
  /** 0..10 — how emotionally necessary the comfort reads. */
  emotional_necessity: number;
  /** True when the truth frames the comfort as branded or optimised. */
  comfort_is_designed: boolean;
  notes: string[];
}

export interface RepeatedComfortSystemsInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readRepeatedComfortSystems(input: RepeatedComfortSystemsInput): RepeatedComfortSystemsReading {
  const { state, truth } = input;
  const notes: string[] = [];
  const ids = STATE_TO_COMFORT[state.id] ?? [];
  const primary = ids[0] ? COMFORT_LIBRARY[ids[0]] : null;
  const comfort_diversity = ids.length;
  const narrow_comfort_fragility = primary !== null && comfort_diversity <= 1;

  const text = truth.truth;
  const comfort_is_designed = BRANDED_COMFORT.test(text) || OPTIMISED_COMFORT.test(text);

  let emotional_necessity = 0;
  if (primary) {
    switch (state.family) {
      case 'collapse':   emotional_necessity = 9; break;
      case 'fatigue':    emotional_necessity = 8; break;
      case 'numbness':   emotional_necessity = 7; break;
      case 'pressure':   emotional_necessity = 7; break;
      default:           emotional_necessity = 6; break;
    }
  }
  if (comfort_is_designed) emotional_necessity = Math.max(0, emotional_necessity - 4);

  if (primary) notes.push(`comfort behavior: ${primary.id} — "${primary.emotional_function}"`);
  if (narrow_comfort_fragility) notes.push('comfort system is NARROW — the body has only one regulator left (fragility signal)');
  if (comfort_is_designed) notes.push('WARNING: comfort is framed as branded / optimised — Phase 22 forbids designed comfort');
  return { primary, comfort_diversity, narrow_comfort_fragility, emotional_necessity, comfort_is_designed, notes };
}
