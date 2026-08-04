/**
 * PERSONAL MYTHOLOGY (Phase 23)
 *
 * The small, private myths a human carries — not the self-story
 * (Phase 23 selfStoryArchitecture), but the MYTHIC beliefs operating
 * beneath it: "if i stop, it all falls apart", "i am the only one
 * who can do this properly", "things go wrong when i relax".
 *
 * These are not true. They are load-bearing. The engine detects the
 * myth, scores its grip, and refuses banners in which the myth is
 * stated as a literary aphorism rather than caught as a lived belief.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type PersonalMythId =
  | 'if-i-stop-it-falls-apart'
  | 'only-i-can-do-it-properly'
  | 'things-go-wrong-when-i-relax'
  | 'i-have-to-earn-the-right-to-rest'
  | 'needing-help-means-failing'
  | 'if-i-am-not-improving-i-am-declining'
  | 'my-value-is-what-i-produce'
  | 'if-they-knew-how-tired-i-am';

export interface PersonalMythRecord {
  id: PersonalMythId;
  the_myth: string;
  what_it_protects_against: string;
}

export const PERSONAL_MYTHS: Record<PersonalMythId, PersonalMythRecord> = {
  'if-i-stop-it-falls-apart':       { id: 'if-i-stop-it-falls-apart',       the_myth: '"if i stop, the whole thing collapses"',           what_it_protects_against: 'the terror of discovering they are not, in fact, load-bearing' },
  'only-i-can-do-it-properly':      { id: 'only-i-can-do-it-properly',      the_myth: '"nobody else will do it properly"',                what_it_protects_against: 'the loss of identity that delegation would expose' },
  'things-go-wrong-when-i-relax':   { id: 'things-go-wrong-when-i-relax',   the_myth: '"the moment i relax, something breaks"',           what_it_protects_against: 'the vulnerability of being off-guard' },
  'i-have-to-earn-the-right-to-rest':{ id: 'i-have-to-earn-the-right-to-rest',the_myth: '"rest has to be earned, and i have not earned it"',what_it_protects_against: 'the guilt of resting without a ledger that permits it' },
  'needing-help-means-failing':     { id: 'needing-help-means-failing',     the_myth: '"asking for help is a kind of failing"',           what_it_protects_against: 'the self-story of the one who does not need much' },
  'if-i-am-not-improving-i-am-declining':{ id: 'if-i-am-not-improving-i-am-declining',the_myth: '"a self that is not improving is a self that is sliding back"',what_it_protects_against: 'the fear of an ordinary, stable, finished self' },
  'my-value-is-what-i-produce':     { id: 'my-value-is-what-i-produce',     the_myth: '"i am worth what i produced this week"',           what_it_protects_against: 'the unbearable question of worth without output' },
  'if-they-knew-how-tired-i-am':    { id: 'if-they-knew-how-tired-i-am',    the_myth: '"if they knew how tired i actually am, something would change for the worse"',what_it_protects_against: 'the risk of being seen as less capable' },
};

const STATE_TO_MYTH: Record<string, PersonalMythId[]> = {
  'silent-burnout':                  ['if-i-stop-it-falls-apart', 'if-they-knew-how-tired-i-am'],
  'overwhelmed-founder':             ['if-i-stop-it-falls-apart', 'only-i-can-do-it-properly'],
  'startup-burnout':                 ['my-value-is-what-i-produce'],
  'parent-overload':                 ['only-i-can-do-it-properly', 'needing-help-means-failing'],
  'partner-overload':                ['needing-help-means-failing'],
  'sunday-anxiety':                  ['things-go-wrong-when-i-relax', 'i-have-to-earn-the-right-to-rest'],
  'late-afternoon-collapse':         ['i-have-to-earn-the-right-to-rest'],
  'always-on-anxiety':               ['things-go-wrong-when-i-relax'],
  'workday-blur':                    ['my-value-is-what-i-produce'],
  'before-meeting-panic':            ['if-they-knew-how-tired-i-am'],
};

const CORE_TO_MYTH: Partial<Record<string, PersonalMythId>> = {
  'silent-burnout':                 'if-i-stop-it-falls-apart',
  'invisible-pressure':             'i-have-to-earn-the-right-to-rest',
  'productivity-identity':          'my-value-is-what-i-produce',
  'always-improving':               'if-i-am-not-improving-i-am-declining',
  'performance-pressure':           'if-they-knew-how-tired-i-am',
};

const APHORISM_FRAMING = /\b(they say|as the saying|in the end,|life is|we are all|the human condition|such is)\b/i;

export interface PersonalMythologyReading {
  primary: PersonalMythRecord | null;
  /** 0..10 — how strong a grip the myth has. */
  myth_grip: number;
  /** True when the myth is framed as a literary aphorism. */
  framed_as_aphorism: boolean;
  notes: string[];
}

export interface PersonalMythologyInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readPersonalMythology(input: PersonalMythologyInput): PersonalMythologyReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: PersonalMythId[] = [];
  for (const id of STATE_TO_MYTH[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_MYTH[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? PERSONAL_MYTHS[candidates[0]] : null;
  const framed_as_aphorism = APHORISM_FRAMING.test(truth.truth);

  let myth_grip = primary ? 7 : 0;
  if (framed_as_aphorism) myth_grip -= 3;
  myth_grip = Math.max(0, Math.min(10, myth_grip));

  if (primary) notes.push(`personal myth: ${primary.id} — ${primary.the_myth}`);
  if (framed_as_aphorism) notes.push('WARNING: myth framed as literary aphorism — Phase 23 wants it caught as a lived belief, not a quote');
  return { primary, myth_grip, framed_as_aphorism, notes };
}
