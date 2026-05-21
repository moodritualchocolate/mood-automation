/**
 * MASK FATIGUE (Phase 19)
 *
 * Distinguishes WORK FATIGUE from PERFORMANCE FATIGUE.
 *
 * Work fatigue is the cost of the work itself — the typing, the
 * thinking, the lifting. Mask fatigue is the cost of maintaining
 * the appearance of being okay WHILE doing the work. They are not
 * the same currency. The body recovers from work fatigue faster
 * than from mask fatigue.
 *
 * Five mask-fatigue kinds:
 *   conversation-fatigue       — too many spoken exchanges in a day
 *   social-depletion            — too many people-present hours
 *   decision-exhaustion         — too many "fine" / "of course" choices
 *   forced-attentiveness        — too many "I'm listening" moments
 *   relational-over-presence    — too much "still here for you" with
 *                                 no margin retained
 *
 * The engine answers two questions:
 *
 *   1. Did the body get tired from THE WORK or from PERFORMING THE ROLE
 *      while doing the work?
 *   2. Does the truth correctly attribute the fatigue, or does it
 *      mistake one for the other?
 *
 * The cinematic value is high — mistaking mask fatigue for work
 * fatigue is one of the central modern errors the spec wants the
 * camera to expose.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type MaskFatigueKindId =
  | 'conversation-fatigue'
  | 'social-depletion'
  | 'decision-exhaustion'
  | 'forced-attentiveness'
  | 'relational-over-presence';

export interface MaskFatigueKindRecord {
  id: MaskFatigueKindId;
  cause: string;
  not_caused_by: string;          // the misattribution to watch for
  observable_in_body: string;
  recovery_requires: string;
}

export const MASK_FATIGUE_LIBRARY: Record<MaskFatigueKindId, MaskFatigueKindRecord> = {
  'conversation-fatigue': {
    id: 'conversation-fatigue',
    cause: 'a day made of spoken exchanges — calls, standups, school-gate chats, dinner-table reports',
    not_caused_by: 'thinking, problem-solving, real work',
    observable_in_body: 'voice rougher than the day required; jaw tighter; an unconscious sigh between rooms',
    recovery_requires: 'no-talk hours — solitude with a low-cognition activity',
  },
  'social-depletion': {
    id: 'social-depletion',
    cause: 'too many hours spent in front of other people, regardless of intensity',
    not_caused_by: 'extroversion vs introversion — the body has a meter regardless of self-image',
    observable_in_body: 'energy drops once the door closes; a thirty-second pause before sitting down',
    recovery_requires: 'physical solitude — being alone in a room with nothing performing',
  },
  'decision-exhaustion': {
    id: 'decision-exhaustion',
    cause: 'a day made of small choices delivered with the same calm tone — "fine", "of course", "happy to"',
    not_caused_by: 'big decisions, which the body knows how to brace for',
    observable_in_body: 'cannot decide what to eat at 21:30; cannot choose what to watch; cannot pick a side at the fork',
    recovery_requires: 'someone else choosing — or eating the same thing for three nights',
  },
  'forced-attentiveness': {
    id: 'forced-attentiveness',
    cause: 'sustained "I\'m listening" performance in meetings, conversations, the kid\'s story',
    not_caused_by: 'genuine listening, which has its own rest pattern',
    observable_in_body: 'eyes that look attentive but unfocus the moment the social pressure releases',
    recovery_requires: 'space where nothing requires being followed',
  },
  'relational-over-presence': {
    id: 'relational-over-presence',
    cause: 'staying warm, available, attuned across too many relationships at once without margin',
    not_caused_by: 'closeness — closeness restores; over-presence depletes',
    observable_in_body: 'a flinch when the phone buzzes; a small dread before the next "how are you"',
    recovery_requires: 'permission to be unavailable — an evening with no relational obligation',
  },
};

const STATE_TO_MASK_FATIGUE: Record<string, MaskFatigueKindId[]> = {
  'social-load-exhaustion':          ['conversation-fatigue', 'social-depletion'],
  'overconnected-exhaustion':        ['relational-over-presence', 'decision-exhaustion'],
  'parent-overload':                 ['forced-attentiveness', 'relational-over-presence'],
  'partner-overload':                ['relational-over-presence'],
  'mentally-absent':                 ['forced-attentiveness'],
  'overwhelmed-founder':             ['decision-exhaustion', 'conversation-fatigue'],
  'overstimulated-office':           ['conversation-fatigue', 'forced-attentiveness'],
  'late-afternoon-collapse':         ['decision-exhaustion'],
  'sunday-anxiety':                  ['decision-exhaustion'],
  'after-meeting-recovery':          ['conversation-fatigue'],
  'emotionally-drained':             ['social-depletion', 'relational-over-presence'],
  'always-on-anxiety':               ['relational-over-presence', 'decision-exhaustion'],
  'silent-burnout':                  ['decision-exhaustion', 'forced-attentiveness'],
  'unread-messages-anxiety':         ['relational-over-presence'],
};

const CORE_TO_MASK_FATIGUE: Partial<Record<string, MaskFatigueKindId>> = {
  'social-mask-fatigue':            'conversation-fatigue',
  'caretaker-fatigue':              'relational-over-presence',
  'decision-fatigue':               'decision-exhaustion',
  'invisible-pressure':             'forced-attentiveness',
  'silent-burnout':                 'decision-exhaustion',
};

const WORK_FATIGUE_LANGUAGE = /\b(deck|email|inbox|deadline|sprint|jira|deploy|production|spreadsheet|report|all[- ]?nighter|long day)\b/i;
const MASK_FATIGUE_LANGUAGE = /\b(another (call|meeting|conversation)|talk(ed|ing)?|reply|replied|listen(ing|ed)?|smile(d|ing)?|nod(ded|ding)?|warm|host(ed|ing)?|patient|of course|happy to|i'?m good)\b/i;

export interface MaskFatigueReading {
  primary: MaskFatigueKindRecord | null;
  /** 0..10 — strength of mask-fatigue signal. */
  mask_fatigue_score: number;
  /** 0..10 — strength of work-fatigue signal (for comparison only). */
  work_fatigue_score: number;
  /** True when mask fatigue dominates work fatigue in the truth-text. */
  fatigue_is_from_performing: boolean;
  /** True when the truth misattributes mask fatigue to work fatigue. */
  fatigue_misattributed: boolean;
  notes: string[];
}

export interface MaskFatigueInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readMaskFatigue(input: MaskFatigueInput): MaskFatigueReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: MaskFatigueKindId[] = [];
  for (const id of STATE_TO_MASK_FATIGUE[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_MASK_FATIGUE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? MASK_FATIGUE_LIBRARY[candidates[0]] : null;

  const text = truth.truth;
  const workFatigueHits = WORK_FATIGUE_LANGUAGE.test(text);
  const maskFatigueHits = MASK_FATIGUE_LANGUAGE.test(text);

  // Mask fatigue score.
  let mask_fatigue_score = 0;
  if (primary) mask_fatigue_score += 5;
  if (maskFatigueHits) mask_fatigue_score += 3;
  mask_fatigue_score = clamp10(mask_fatigue_score);

  // Work fatigue score.
  let work_fatigue_score = workFatigueHits ? 5 : 0;
  // State family fatigue contributes to both.
  if (state.family === 'fatigue' || state.family === 'collapse') {
    mask_fatigue_score = clamp10(mask_fatigue_score + 1);
    work_fatigue_score = clamp10(work_fatigue_score + 1);
  }

  const fatigue_is_from_performing = mask_fatigue_score >= 6 && mask_fatigue_score > work_fatigue_score;

  // Misattribution: truth describes work fatigue language but the
  // primary detected kind is mask-fatigue and is strong.
  const fatigue_misattributed =
    workFatigueHits && !maskFatigueHits && primary !== null && mask_fatigue_score >= 6;

  if (primary) {
    notes.push(`mask fatigue: ${primary.id} — caused by "${primary.cause}"`);
    notes.push(`NOT caused by: ${primary.not_caused_by}`);
  } else {
    notes.push('no mask-fatigue kind identified');
  }
  if (fatigue_is_from_performing) {
    notes.push('fatigue is from PERFORMING functionality, not from the work itself');
  }
  if (fatigue_misattributed) {
    notes.push('WARNING: the truth attributes fatigue to work, but the body is actually exhausted from the mask');
  }

  return {
    primary,
    mask_fatigue_score,
    work_fatigue_score,
    fatigue_is_from_performing,
    fatigue_misattributed,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
