/**
 * RITUAL COMPENSATION (Phase 18)
 *
 * The body builds rituals to compensate for the things modern systems
 * remove. Caffeine replaces sleep. Snacks replace processing. A second
 * shower replaces a real break. The structure looks like self-care —
 * it is actually structural compensation for an unaddressed deficit.
 *
 * The spec named these compensation rituals (extended):
 *   the third coffee
 *   the nighttime snack
 *   the breakfast skipped, the lunch overloaded
 *   the long shower as a delayed pause
 *   the second sleep that never arrives
 *   the late afternoon sugar
 *   the alcohol after the kids are down
 *
 * Phase 18 ritualCompensation is structurally different from:
 *   - Phase 14 modernNumbing (passive sedation)
 *   - Phase 17 recoveryFailure (rest that does not restore)
 *   - Phase 18 microEscape (ephemeral withdrawal)
 *
 * A ritual is REPEATED INTENTIONAL BEHAVIOR. The subject would name it
 * if asked ("my afternoon coffee"). What they would NOT name is the
 * thing it is replacing.
 *
 * Each ritual scores:
 *   replacement_truth   — what real need it is standing in for
 *   ritual_compulsion   — how non-negotiable it has become
 *   visibility          — how visible to the subject (rituals are SEEN
 *                         by the subject; loops are NOT — that's the
 *                         distinguishing axis)
 *   honest_observation  — does the truth-text name the ritual without
 *                         romanticising it?
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type CompensationRitualId =
  | 'third-coffee'
  | 'nighttime-snack'
  | 'skipped-breakfast-overloaded-lunch'
  | 'long-shower-as-pause'
  | 'second-sleep-that-never-arrives'
  | 'late-afternoon-sugar'
  | 'post-bedtime-alcohol'
  | 'predawn-coffee-alone'
  | 'fridge-light-at-23-45'
  | 'energy-drink-at-15-30';

export interface CompensationRitualRecord {
  id: CompensationRitualId;
  observable_moment: string;
  what_it_replaces: string;        // the real need
  honest_phrase: string;            // the unromanticised description
  romanticised_phrase: string;      // the wellness/marketing version (forbidden)
  daily_frequency: string;
}

export const COMPENSATION_RITUALS: Record<CompensationRitualId, CompensationRitualRecord> = {
  'third-coffee': {
    id: 'third-coffee',
    observable_moment: '15:42, third mug poured, no one asked',
    what_it_replaces: 'a real lunch / a real break / actual sleep last night',
    honest_phrase: 'the third coffee that has stopped working',
    romanticised_phrase: 'my afternoon ritual',
    daily_frequency: 'most weekdays',
  },
  'nighttime-snack': {
    id: 'nighttime-snack',
    observable_moment: '22:38, fridge open, no real hunger, something is taken anyway',
    what_it_replaces: 'the processing the day did not include',
    honest_phrase: 'the snack that has nothing to do with food',
    romanticised_phrase: 'a little something before bed',
    daily_frequency: 'four to six nights a week',
  },
  'skipped-breakfast-overloaded-lunch': {
    id: 'skipped-breakfast-overloaded-lunch',
    observable_moment: 'breakfast was a coffee; lunch is a full meal eaten in front of the screen at 13:00',
    what_it_replaces: 'the slow morning the schedule will not allow',
    honest_phrase: 'eating twice as much at lunch because the morning was given up',
    romanticised_phrase: 'I do intermittent fasting',
    daily_frequency: 'workdays',
  },
  'long-shower-as-pause': {
    id: 'long-shower-as-pause',
    observable_moment: 'shower running for fourteen minutes; subject standing under the water doing nothing in particular',
    what_it_replaces: 'a real, scheduled, sanctioned pause',
    honest_phrase: 'the shower that is mostly a pause',
    romanticised_phrase: 'my self-care ritual',
    daily_frequency: 'most evenings',
  },
  'second-sleep-that-never-arrives': {
    id: 'second-sleep-that-never-arrives',
    observable_moment: 'lies down again at 14:30 / Saturday afternoon; phone in hand; sleep does not come',
    what_it_replaces: 'the rest the body did not get the first time',
    honest_phrase: 'lying down hoping sleep happens; it does not',
    romanticised_phrase: 'I love a nap',
    daily_frequency: 'two or three afternoons a week',
  },
  'late-afternoon-sugar': {
    id: 'late-afternoon-sugar',
    observable_moment: '16:20, opens a drawer, finds the chocolate / the candy / the leftover something',
    what_it_replaces: 'a real cognitive reset',
    honest_phrase: 'the sugar that costs more than it gives',
    romanticised_phrase: 'I deserve this',
    daily_frequency: 'most afternoons',
  },
  'post-bedtime-alcohol': {
    id: 'post-bedtime-alcohol',
    observable_moment: '21:14, the kids are down, the glass comes out, "just one"',
    what_it_replaces: 'a transition phase from parent to person',
    honest_phrase: 'the glass that signals the day is over',
    romanticised_phrase: 'I earned it',
    daily_frequency: 'most weeknights',
  },
  'predawn-coffee-alone': {
    id: 'predawn-coffee-alone',
    observable_moment: '05:42, before anyone else is up, the only quiet of the day, coffee held with both hands',
    what_it_replaces: 'a portion of the day the subject otherwise never gets alone',
    honest_phrase: 'getting up earlier than they need to, to get a half-hour nobody else has',
    romanticised_phrase: 'I love my morning routine',
    daily_frequency: 'most days',
  },
  'fridge-light-at-23-45': {
    id: 'fridge-light-at-23-45',
    observable_moment: '23:45, fridge door open, the only light in the apartment, the subject looking at the contents without choosing',
    what_it_replaces: 'a feeling not yet named',
    honest_phrase: 'standing at the fridge late at night, not hungry, not deciding',
    romanticised_phrase: 'midnight snack',
    daily_frequency: 'several nights a week',
  },
  'energy-drink-at-15-30': {
    id: 'energy-drink-at-15-30',
    observable_moment: '15:30, the can opens with a click, the day was already over inside',
    what_it_replaces: 'rest the schedule did not allow',
    honest_phrase: 'the can that signals the day already broke',
    romanticised_phrase: 'I need my pre-workout',
    daily_frequency: 'workdays',
  },
};

const STATE_TO_RITUAL: Record<string, CompensationRitualId[]> = {
  'third-coffee':                   ['third-coffee'],
  'late-afternoon-collapse':         ['third-coffee', 'late-afternoon-sugar', 'energy-drink-at-15-30'],
  'low-battery-feeling':             ['late-afternoon-sugar', 'energy-drink-at-15-30'],
  'workday-blur':                    ['skipped-breakfast-overloaded-lunch', 'third-coffee'],
  'mentally-offline':                ['third-coffee', 'late-afternoon-sugar'],
  'late-kitchen-silence':            ['nighttime-snack', 'fridge-light-at-23-45'],
  'exhausted-but-wired':             ['post-bedtime-alcohol', 'second-sleep-that-never-arrives'],
  'parent-overload':                 ['post-bedtime-alcohol'],
  'partner-overload':                ['post-bedtime-alcohol'],
  'sunday-anxiety':                  ['post-bedtime-alcohol', 'long-shower-as-pause'],
  'emotionally-drained':             ['long-shower-as-pause', 'nighttime-snack'],
  'overwhelmed-founder':             ['predawn-coffee-alone', 'third-coffee'],
  'startup-burnout':                 ['third-coffee', 'energy-drink-at-15-30'],
  'restless-night':                  ['fridge-light-at-23-45'],
  'tired-but-continuing':            ['energy-drink-at-15-30', 'third-coffee'],
  'sleep-debt':                      ['third-coffee', 'energy-drink-at-15-30'],
};

const CORE_TO_RITUAL: Partial<Record<string, CompensationRitualId>> = {
  'silent-burnout':                 'third-coffee',
  'too-tired-to-rest':              'post-bedtime-alcohol',
  'revenge-bedtime-procrastination':'nighttime-snack',
  'invisible-pressure':             'long-shower-as-pause',
  'hidden-anxiety':                 'late-afternoon-sugar',
  'emotional-numbness':             'nighttime-snack',
  'overstimulation':                'energy-drink-at-15-30',
};

export interface CompensationRitualReading {
  primary: CompensationRitualRecord | null;
  secondary: CompensationRitualRecord | null;
  /** 0..10 — overall ritual-compensation signal strength. */
  ritual_compensation_score: number;
  /** 0..10 — how clearly the ritual stands in for an unaddressed need. */
  replacement_truth: number;
  /** 0..10 — how compulsive the ritual reads (10 = cannot skip). */
  ritual_compulsion: number;
  /** 0..10 — how visible the ritual is to the subject themselves. */
  visibility_to_self: number;
  /** 0..10 — does the truth-text describe the ritual without
   *  romanticising it? (10 = honest; 0 = wellness vocabulary). */
  honest_observation: number;
  /** True when the truth uses the romanticised vocabulary instead of
   *  the honest one — meta-critic should flag. */
  romanticisation_detected: boolean;
  notes: string[];
}

export interface CompensationRitualInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const ROMANTICISATION_PATTERNS = /\b(ritual|self[- ]?care|wellness|treat[- ]?yourself|I deserve|me[- ]time|reset|reset day|sunday reset|earned it|little victory|small joy|small luxury|sacred|cozy|cozy night|romanticize|romanticise)\b/i;
const HONEST_PATTERNS = /\b(third|third coffee|fridge|standing|already|again|nothing|not really|did not|wasn[' ]t|isn[' ]t)\b/i;

export function readCompensationRitual(input: CompensationRitualInput): CompensationRitualReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: CompensationRitualId[] = [];
  for (const id of STATE_TO_RITUAL[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_RITUAL[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? COMPENSATION_RITUALS[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? COMPENSATION_RITUALS[candidates[1]]
    : null;

  // Replacement truth — how clearly the ritual replaces a real need.
  let replacement_truth = 0;
  if (primary) replacement_truth = 7;
  if (secondary) replacement_truth = Math.min(10, replacement_truth + 1);

  // Compulsion — varies by ritual. Caffeine + alcohol score highest;
  // long shower scores lower.
  let ritual_compulsion = 0;
  if (primary) {
    const HIGH = new Set<CompensationRitualId>(['third-coffee', 'post-bedtime-alcohol', 'energy-drink-at-15-30', 'nighttime-snack']);
    const MID  = new Set<CompensationRitualId>(['late-afternoon-sugar', 'fridge-light-at-23-45', 'predawn-coffee-alone']);
    ritual_compulsion = HIGH.has(primary.id) ? 8 : MID.has(primary.id) ? 6 : 4;
  }

  // Visibility to self — rituals are NAMED by the subject; this is
  // their distinguishing axis from loops (subject does not see loops).
  const visibility_to_self = primary ? 8 : 0;

  // Honest observation — does the truth describe the ritual honestly?
  const text = truth.truth.toLowerCase();
  const romanticisation_detected = ROMANTICISATION_PATTERNS.test(text);
  const honestLanguage = HONEST_PATTERNS.test(text);
  let honest_observation = 5;
  if (honestLanguage) honest_observation += 3;
  if (romanticisation_detected) honest_observation -= 4;
  honest_observation = clamp10(honest_observation);

  // Composite.
  let score = 0;
  if (primary) score += 4;
  if (secondary) score += 1.5;
  score += (replacement_truth / 10) * 1.5;
  score += (honest_observation / 10) * 2;
  if (romanticisation_detected) score -= 2;
  const ritual_compensation_score = clamp10(score);

  if (primary) {
    notes.push(`primary ritual: ${primary.id} — replaces "${primary.what_it_replaces}"`);
    notes.push(`honest phrase: "${primary.honest_phrase}"`);
    notes.push(`do NOT use: "${primary.romanticised_phrase}"`);
  } else {
    notes.push('no compensation ritual matched');
  }
  if (romanticisation_detected) {
    notes.push('WARNING: truth uses romanticised vocabulary — banner is selling self-care, not observing reality');
  }

  return {
    primary,
    secondary,
    ritual_compensation_score,
    replacement_truth,
    ritual_compulsion,
    visibility_to_self,
    honest_observation,
    romanticisation_detected,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
