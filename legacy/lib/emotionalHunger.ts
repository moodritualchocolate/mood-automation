/**
 * EMOTIONAL HUNGER (Phase 20)
 *
 * Detects the EMOTIONAL DEFICITS humans carry — the things the body
 * is hungry FOR underneath the surface behavior. Not "what they want
 * to buy", but "what their nervous system is short on".
 *
 * Different from Phase 20 desireArchitecture (the structural reach)
 * and Phase 13 invisibleStakes (the cost). Phase 20 emotionalHunger
 * is the DEFICIT — the empty box the body keeps trying to fill.
 *
 * 10 modeled hungers, none coded for marketing.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type EmotionalHungerId =
  | 'unconditional-quiet'
  | 'witness-without-judgment'
  | 'continuity-of-self'
  | 'feeling-felt-without-explaining'
  | 'reliable-warmth'
  | 'permission-to-be-bad-at-it'
  | 'a-day-with-no-deliverable'
  | 'attention-not-as-currency'
  | 'softness-that-is-not-bargained-for'
  | 'a-hand-that-asks-nothing-back';

export interface EmotionalHungerRecord {
  id: EmotionalHungerId;
  the_deficit: string;
  how_it_shows_up: string;          // observable behavior the deficit drives
}

export const HUNGER_LIBRARY: Record<EmotionalHungerId, EmotionalHungerRecord> = {
  'unconditional-quiet': {
    id: 'unconditional-quiet',
    the_deficit: 'quiet that is not earned, scheduled, or negotiated for',
    how_it_shows_up: 'lingering in transitional spaces — car, elevator, bathroom — past necessity',
  },
  'witness-without-judgment': {
    id: 'witness-without-judgment',
    the_deficit: 'someone seeing the body as-is without evaluating it',
    how_it_shows_up: 'over-explaining when asked a simple question; preemptive justification',
  },
  'continuity-of-self': {
    id: 'continuity-of-self',
    the_deficit: 'a self that is the same self across environments',
    how_it_shows_up: 'a small disorientation when switching from work-self to home-self',
  },
  'feeling-felt-without-explaining': {
    id: 'feeling-felt-without-explaining',
    the_deficit: 'someone who can read the room before the room is described',
    how_it_shows_up: 'fatigue when someone asks "how are you" — having to write the answer counts as additional work',
  },
  'reliable-warmth': {
    id: 'reliable-warmth',
    the_deficit: 'a warmth that is there whether the body earned it that week or not',
    how_it_shows_up: 'a small hesitation before reaching out — checking whether warmth is available right now',
  },
  'permission-to-be-bad-at-it': {
    id: 'permission-to-be-bad-at-it',
    the_deficit: 'somewhere the subject is allowed to be unskilled without it becoming a referendum',
    how_it_shows_up: 'an unwillingness to try a new thing in front of anyone',
  },
  'a-day-with-no-deliverable': {
    id: 'a-day-with-no-deliverable',
    the_deficit: 'a day with no output anyone is waiting for',
    how_it_shows_up: 'a low-grade dread on Sunday afternoon that has no specific cause',
  },
  'attention-not-as-currency': {
    id: 'attention-not-as-currency',
    the_deficit: 'attention given that does not have to be returned',
    how_it_shows_up: 'flinching at "thanks for listening!" — the gratitude marks the exchange',
  },
  'softness-that-is-not-bargained-for': {
    id: 'softness-that-is-not-bargained-for',
    the_deficit: 'tenderness the body did not have to negotiate for',
    how_it_shows_up: 'an over-large reaction to a small unsolicited kindness',
  },
  'a-hand-that-asks-nothing-back': {
    id: 'a-hand-that-asks-nothing-back',
    the_deficit: 'a touch / a help / a check-in with no reciprocity expected',
    how_it_shows_up: 'a small wariness before accepting help — calculating the social debt incurred',
  },
};

const STATE_TO_HUNGER: Record<string, EmotionalHungerId[]> = {
  'silent-burnout':                  ['unconditional-quiet', 'a-day-with-no-deliverable'],
  'overconnected-exhaustion':        ['attention-not-as-currency'],
  'mentally-absent':                 ['feeling-felt-without-explaining'],
  'emotionally-drained':             ['witness-without-judgment', 'softness-that-is-not-bargained-for'],
  'parent-overload':                 ['a-hand-that-asks-nothing-back', 'reliable-warmth'],
  'partner-overload':                ['reliable-warmth', 'feeling-felt-without-explaining'],
  'social-load-exhaustion':          ['unconditional-quiet'],
  'workday-blur':                    ['continuity-of-self'],
  'always-on-anxiety':               ['a-day-with-no-deliverable'],
  'sunday-anxiety':                  ['a-day-with-no-deliverable'],
};

const CORE_TO_HUNGER: Partial<Record<string, EmotionalHungerId>> = {
  'silent-burnout':                 'unconditional-quiet',
  'invisible-pressure':             'permission-to-be-bad-at-it',
  'emotional-numbness':             'feeling-felt-without-explaining',
  'social-mask-fatigue':            'witness-without-judgment',
  'hidden-anxiety':                 'reliable-warmth',
  'caretaker-fatigue':              'a-hand-that-asks-nothing-back',
};

export interface EmotionalHungerReading {
  primary: EmotionalHungerRecord | null;
  /** 0..10 — overall hunger signal strength. */
  hunger_intensity: number;
  /** 0..10 — does the truth describe the deficit or the symptom of the deficit? (10 = symptom — cinematic) */
  symptom_visible: boolean;
  notes: string[];
}

export interface EmotionalHungerInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readEmotionalHunger(input: EmotionalHungerInput): EmotionalHungerReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: EmotionalHungerId[] = [];
  for (const id of STATE_TO_HUNGER[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_HUNGER[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? HUNGER_LIBRARY[candidates[0]] : null;

  // Symptom visible when the truth uses observed-behavior verbs.
  const symptom_visible = /\b(linger(s|ed|ing)?|hesitat(e|ed|es)|flinch(es|ed)?|over[- ]explain(s|ed)?|wary|wariness)\b/i.test(truth.truth);

  let hunger_intensity = 0;
  if (primary) hunger_intensity += 6;
  if (symptom_visible) hunger_intensity += 2;
  hunger_intensity = clamp10(hunger_intensity);

  if (primary) notes.push(`emotional hunger: ${primary.id} — deficit "${primary.the_deficit}"`);
  if (symptom_visible) notes.push('truth observes a symptom of the hunger, not the hunger itself — the photograph is doing the work');

  return { primary, hunger_intensity, symptom_visible, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
