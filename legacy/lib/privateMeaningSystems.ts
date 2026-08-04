/**
 * PRIVATE MEANING SYSTEMS (Phase 23)
 *
 * Each human runs a private system of what COUNTS — what makes a day
 * a good day, what makes an effort worth it, what registers as
 * meaningful. These systems are mostly inherited, mostly unexamined,
 * and almost never spoken.
 *
 * The engine detects the meaning-system the candidate banner is
 * operating inside, and — importantly — whether the meaning-system
 * is being QUESTIONED by the moment in the banner. A banner in which
 * a private meaning-system is quietly failing is the cinematic ideal.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type MeaningSystemId =
  | 'a-day-counts-if-it-was-productive'
  | 'effort-counts-if-it-was-hard'
  | 'a-parent-counts-if-the-kids-are-okay'
  | 'a-week-counts-if-nothing-was-dropped'
  | 'rest-counts-only-if-it-was-earned'
  | 'a-self-counts-if-it-is-improving'
  | 'time-counts-if-it-produced-something'
  | 'a-relationship-counts-if-it-is-maintained';

export interface MeaningSystemRecord {
  id: MeaningSystemId;
  the_rule: string;
  the_quiet_failure: string;        // how the system fails the subject
}

export const MEANING_SYSTEMS: Record<MeaningSystemId, MeaningSystemRecord> = {
  'a-day-counts-if-it-was-productive': {
    id: 'a-day-counts-if-it-was-productive',
    the_rule: 'a day is only valid if it produced measurable output',
    the_quiet_failure: 'days that were lived but not produced are filed as wasted',
  },
  'effort-counts-if-it-was-hard': {
    id: 'effort-counts-if-it-was-hard',
    the_rule: 'effort is only real if it cost something',
    the_quiet_failure: 'things that come easily are discounted, even when they matter',
  },
  'a-parent-counts-if-the-kids-are-okay': {
    id: 'a-parent-counts-if-the-kids-are-okay',
    the_rule: 'the parent\'s worth is settled entirely by the children\'s state',
    the_quiet_failure: 'the parent has no worth-account of their own',
  },
  'a-week-counts-if-nothing-was-dropped': {
    id: 'a-week-counts-if-nothing-was-dropped',
    the_rule: 'a good week is one with no dropped balls',
    the_quiet_failure: 'the week is graded on absence of failure, never on presence of life',
  },
  'rest-counts-only-if-it-was-earned': {
    id: 'rest-counts-only-if-it-was-earned',
    the_rule: 'rest is permitted only after a sufficient quantity of work',
    the_quiet_failure: 'the sufficient quantity is never defined, so rest never qualifies',
  },
  'a-self-counts-if-it-is-improving': {
    id: 'a-self-counts-if-it-is-improving',
    the_rule: 'the self is valid only while on an improvement trajectory',
    the_quiet_failure: 'a stable, non-improving self reads as a failing one',
  },
  'time-counts-if-it-produced-something': {
    id: 'time-counts-if-it-produced-something',
    the_rule: 'time is only well-spent if it has an output',
    the_quiet_failure: 'unstructured time generates guilt instead of rest',
  },
  'a-relationship-counts-if-it-is-maintained': {
    id: 'a-relationship-counts-if-it-is-maintained',
    the_rule: 'a relationship is only real if it is actively maintained',
    the_quiet_failure: 'relationships that could survive neglect are still treated as obligations',
  },
};

const STATE_TO_MEANING: Record<string, MeaningSystemId[]> = {
  'silent-burnout':                  ['a-day-counts-if-it-was-productive', 'rest-counts-only-if-it-was-earned'],
  'sunday-anxiety':                  ['a-week-counts-if-nothing-was-dropped', 'time-counts-if-it-produced-something'],
  'overwhelmed-founder':             ['a-self-counts-if-it-is-improving'],
  'parent-overload':                 ['a-parent-counts-if-the-kids-are-okay'],
  'partner-overload':                ['a-relationship-counts-if-it-is-maintained'],
  'workday-blur':                    ['time-counts-if-it-produced-something'],
  'late-afternoon-collapse':         ['rest-counts-only-if-it-was-earned'],
  'always-on-anxiety':               ['a-week-counts-if-nothing-was-dropped'],
  'overconnected-exhaustion':        ['a-relationship-counts-if-it-is-maintained'],
};

const CORE_TO_MEANING: Partial<Record<string, MeaningSystemId>> = {
  'productivity-identity':          'a-day-counts-if-it-was-productive',
  'invisible-pressure':             'a-week-counts-if-nothing-was-dropped',
  'too-tired-to-rest':              'rest-counts-only-if-it-was-earned',
  'always-improving':               'a-self-counts-if-it-is-improving',
};

const QUESTIONING_LANGUAGE = /\b(but|even though|and still|did not feel|wasn[' ]?t enough|for what|why does|no longer sure)\b/i;

export interface PrivateMeaningSystemsReading {
  primary: MeaningSystemRecord | null;
  /** 0..10 — strength of the meaning-system presence. */
  meaning_system_strength: number;
  /** True when the moment is quietly QUESTIONING the meaning-system. */
  system_under_question: boolean;
  notes: string[];
}

export interface PrivateMeaningSystemsInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readPrivateMeaningSystems(input: PrivateMeaningSystemsInput): PrivateMeaningSystemsReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: MeaningSystemId[] = [];
  for (const id of STATE_TO_MEANING[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_MEANING[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? MEANING_SYSTEMS[candidates[0]] : null;
  const system_under_question = QUESTIONING_LANGUAGE.test(truth.truth);

  let meaning_system_strength = primary ? 6 : 0;
  if (primary && system_under_question) meaning_system_strength += 2;
  meaning_system_strength = Math.min(10, meaning_system_strength);

  if (primary) notes.push(`private meaning system: ${primary.id} — rule "${primary.the_rule}"`);
  if (system_under_question) notes.push('the moment quietly QUESTIONS the meaning system — cinematic ideal of Phase 23');
  return { primary, meaning_system_strength, system_under_question, notes };
}
