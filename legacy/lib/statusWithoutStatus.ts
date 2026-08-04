/**
 * STATUS WITHOUT STATUS (Phase 20)
 *
 * Modern status is no longer luxury. It is the QUIET COMPETENCE
 * markers humans use to signal worth without naming it: an empty
 * inbox, a closed laptop by 18:30, a calm tone in a hard meeting,
 * a kid who is reading well, a kitchen that does not smell of last
 * night, a Sunday that included a walk.
 *
 * The engine catches the candidate banner's status signature WITHOUT
 * letting it become luxury aesthetics, productivity porn, or "quiet
 * luxury" — all of which the spec explicitly forbids.
 *
 * Scores:
 *   quiet_status_strength   — how strongly the signal reads as
 *                             worth-without-naming-it
 *   luxury_contamination    — how close the signal sits to luxury vocab
 *   productivity_porn_risk  — how close the signal sits to optimisation
 *                             aesthetics
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type QuietStatusMarkerId =
  | 'closed-laptop-by-1830'
  | 'inbox-not-a-source-of-shame'
  | 'kitchen-that-doesnt-smell-of-yesterday'
  | 'calm-tone-in-hard-meeting'
  | 'kid-who-is-reading-well'
  | 'sunday-that-included-a-walk'
  | 'remembered-an-anniversary-without-a-reminder'
  | 'shower-with-warm-water-still-left'
  | 'morning-that-was-not-rushed'
  | 'a-friend-who-still-calls';

export interface QuietStatusMarkerRecord {
  id: QuietStatusMarkerId;
  the_signal: string;
  what_it_signifies: string;
  failure_mode: 'luxury-contamination' | 'productivity-porn' | 'wellness-cliche';
}

export const QUIET_STATUS: Record<QuietStatusMarkerId, QuietStatusMarkerRecord> = {
  'closed-laptop-by-1830': {
    id: 'closed-laptop-by-1830',
    the_signal: 'laptop closed at 18:30, not opened again that evening',
    what_it_signifies: 'a body that has built or earned a boundary around its time',
    failure_mode: 'productivity-porn',
  },
  'inbox-not-a-source-of-shame': {
    id: 'inbox-not-a-source-of-shame',
    the_signal: 'opening the inbox without bracing — there are unread emails but they will keep',
    what_it_signifies: 'a body that is not at the mercy of asynchronous urgency',
    failure_mode: 'productivity-porn',
  },
  'kitchen-that-doesnt-smell-of-yesterday': {
    id: 'kitchen-that-doesnt-smell-of-yesterday',
    the_signal: 'walking into a kitchen at 07:14 that does not smell of last night',
    what_it_signifies: 'a household that did the small thing the night before so the morning is not punishing',
    failure_mode: 'wellness-cliche',
  },
  'calm-tone-in-hard-meeting': {
    id: 'calm-tone-in-hard-meeting',
    the_signal: 'voice steady during a hard sentence that did not need to be steady',
    what_it_signifies: 'a body that has internal resources the room did not require',
    failure_mode: 'productivity-porn',
  },
  'kid-who-is-reading-well': {
    id: 'kid-who-is-reading-well',
    the_signal: 'a child sounding out a word at the dinner table that the parent did not coach',
    what_it_signifies: 'a household with attention surplus, not deficit',
    failure_mode: 'wellness-cliche',
  },
  'sunday-that-included-a-walk': {
    id: 'sunday-that-included-a-walk',
    the_signal: 'a Sunday that contained a non-errand walk',
    what_it_signifies: 'time that was used for nothing measurable',
    failure_mode: 'wellness-cliche',
  },
  'remembered-an-anniversary-without-a-reminder': {
    id: 'remembered-an-anniversary-without-a-reminder',
    the_signal: 'a partner-anniversary the calendar did not prompt; the subject knew',
    what_it_signifies: 'capacity for relational attention not delegated to software',
    failure_mode: 'luxury-contamination',
  },
  'shower-with-warm-water-still-left': {
    id: 'shower-with-warm-water-still-left',
    the_signal: 'a long shower because the household was not contesting the hot water',
    what_it_signifies: 'enough margin for the body to not negotiate its small comforts',
    failure_mode: 'luxury-contamination',
  },
  'morning-that-was-not-rushed': {
    id: 'morning-that-was-not-rushed',
    the_signal: 'leaving the house at 08:14 with coffee still in the cup',
    what_it_signifies: 'a morning the body got to inhabit, not perform',
    failure_mode: 'wellness-cliche',
  },
  'a-friend-who-still-calls': {
    id: 'a-friend-who-still-calls',
    the_signal: 'a phone call from a friend, unscheduled, not about an event',
    what_it_signifies: 'relationships with maintenance other people have paid for',
    failure_mode: 'wellness-cliche',
  },
};

const STATE_TO_MARKER: Record<string, QuietStatusMarkerId[]> = {
  'workday-blur':                    ['closed-laptop-by-1830'],
  'silent-burnout':                  ['inbox-not-a-source-of-shame'],
  'overconnected-exhaustion':        ['inbox-not-a-source-of-shame'],
  'sunday-anxiety':                  ['sunday-that-included-a-walk', 'morning-that-was-not-rushed'],
  'parent-overload':                 ['kid-who-is-reading-well', 'morning-that-was-not-rushed'],
  'partner-overload':                ['remembered-an-anniversary-without-a-reminder'],
  'emotionally-drained':             ['a-friend-who-still-calls'],
  'overwhelmed-founder':             ['calm-tone-in-hard-meeting'],
};

const LUXURY_VOCAB = /\b(luxur(y|ious)|premium|elite|elevat(e|ed|ing)|curated|sumptuous|refined|exquisite|bespoke)\b/i;
const PRODUCTIVITY_PORN_VOCAB = /\b(optimi[sz]ed?|productivity|maximi[sz]ed?|systems?|workflow|hustl(e|ing)|grind|10x|leverag(e|ed|ing))\b/i;
const WELLNESS_CLICHE_VOCAB = /\b(self[- ]care|wellness|sanctuary|sacred|cozy|cosy|ritual)\b/i;

export interface QuietStatusReading {
  primary: QuietStatusMarkerRecord | null;
  /** 0..10 — how strongly the truth catches a quiet-status marker. */
  quiet_status_strength: number;
  /** 0..10 — how close the truth sits to luxury vocabulary. */
  luxury_contamination: number;
  /** 0..10 — how close the truth sits to productivity-porn aesthetics. */
  productivity_porn_risk: number;
  /** 0..10 — wellness-cliche contamination. */
  wellness_cliche_risk: number;
  notes: string[];
}

export interface QuietStatusInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readQuietStatus(input: QuietStatusInput): QuietStatusReading {
  const { state, truth } = input;
  const notes: string[] = [];

  const id = STATE_TO_MARKER[state.id]?.[0] ?? null;
  const primary = id ? QUIET_STATUS[id] : null;

  const text = truth.truth;
  const luxury_contamination = LUXURY_VOCAB.test(text) ? 8 : 1;
  const productivity_porn_risk = PRODUCTIVITY_PORN_VOCAB.test(text) ? 8 : 1;
  const wellness_cliche_risk = WELLNESS_CLICHE_VOCAB.test(text) ? 8 : 1;

  let quiet_status_strength = 0;
  if (primary) quiet_status_strength += 6;
  quiet_status_strength -= Math.max(luxury_contamination, productivity_porn_risk, wellness_cliche_risk) - 1;
  quiet_status_strength = clamp10(quiet_status_strength);

  if (primary) notes.push(`quiet status marker: ${primary.id} — "${primary.the_signal}"`);
  if (luxury_contamination >= 5) notes.push('WARNING: truth uses luxury vocabulary — quiet status becomes luxury aesthetics');
  if (productivity_porn_risk >= 5) notes.push('WARNING: truth uses optimisation vocabulary — quiet status becomes productivity porn');
  if (wellness_cliche_risk >= 5) notes.push('WARNING: truth uses wellness vocabulary');

  return { primary, quiet_status_strength, luxury_contamination, productivity_porn_risk, wellness_cliche_risk, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
