/**
 * INVISIBLE ENVY (Phase 20)
 *
 * The QUIET, UNNAMED envy modern humans carry — not at obvious luxury,
 * but at the things they cannot quite admit they want: a friend whose
 * weekend looked rested, a peer who got promoted with grace, a sibling
 * who replied to the family chat without dread, a parent at the school
 * gate who looked unhurried.
 *
 * The engine catches this without letting it become "social media
 * comparison aesthetics" or "luxury envy" — both spec-forbidden.
 *
 * Scores:
 *   envy_specificity         — how specific the envy target is
 *                              (specific = real; generic = manufactured)
 *   envy_unspoken_ness        — how much the envy is left unnamed
 *   social_media_contamination — how close to platform comparison
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type EnvyTargetId =
  | 'friend-whose-weekend-looked-rested'
  | 'peer-who-got-promoted-with-grace'
  | 'sibling-replying-without-dread'
  | 'parent-at-school-gate-looking-unhurried'
  | 'colleague-who-said-no'
  | 'old-friend-still-in-the-same-job'
  | 'partner-of-a-friend-who-cooks'
  | 'a-stranger-with-time'
  | 'someone-whose-parents-call-without-occasion'
  | 'a-person-with-a-week-without-checking-anything';

export interface EnvyTargetRecord {
  id: EnvyTargetId;
  the_thing: string;
  why_unspoken: string;
}

export const ENVY_LIBRARY: Record<EnvyTargetId, EnvyTargetRecord> = {
  'friend-whose-weekend-looked-rested': {
    id: 'friend-whose-weekend-looked-rested',
    the_thing: 'a friend who came back from a Sunday looking like they had two days off, not one',
    why_unspoken: 'envying rest does not match the subject\'s self-image as "the responsible one"',
  },
  'peer-who-got-promoted-with-grace': {
    id: 'peer-who-got-promoted-with-grace',
    the_thing: 'a peer who got the role and did not have to perform composure about it',
    why_unspoken: 'envying ease is more embarrassing than envying outcome',
  },
  'sibling-replying-without-dread': {
    id: 'sibling-replying-without-dread',
    the_thing: 'a sibling who reads the family chat at 09:14 without bracing',
    why_unspoken: 'the dread is private; admitting envy would name the dread',
  },
  'parent-at-school-gate-looking-unhurried': {
    id: 'parent-at-school-gate-looking-unhurried',
    the_thing: 'another parent at pickup at 15:31 in a posture the subject\'s body has not held in two years',
    why_unspoken: 'envying another parent feels like a verdict on the subject\'s own parenting',
  },
  'colleague-who-said-no': {
    id: 'colleague-who-said-no',
    the_thing: 'a colleague who declined a request in the standup and went on with their day',
    why_unspoken: 'envying somebody\'s no is admitting the subject\'s yes-by-default',
  },
  'old-friend-still-in-the-same-job': {
    id: 'old-friend-still-in-the-same-job',
    the_thing: 'an old friend whose career path looked dull at 26 and looks intact at 39',
    why_unspoken: 'the subject was supposed to want the more interesting path',
  },
  'partner-of-a-friend-who-cooks': {
    id: 'partner-of-a-friend-who-cooks',
    the_thing: 'a friend\'s partner who quietly makes dinner without it becoming a personality',
    why_unspoken: 'the small daily reliabilities the subject has not received in years',
  },
  'a-stranger-with-time': {
    id: 'a-stranger-with-time',
    the_thing: 'a stranger at the café at 11:14 on a Tuesday with a book, alone, not waiting for anyone',
    why_unspoken: 'envying a stranger\'s middle-of-the-day quiet exposes the impossibility of the subject\'s own',
  },
  'someone-whose-parents-call-without-occasion': {
    id: 'someone-whose-parents-call-without-occasion',
    the_thing: 'a colleague whose parent calls at 12:14 about nothing, casually',
    why_unspoken: 'naming this envy raises questions the subject does not want to ask',
  },
  'a-person-with-a-week-without-checking-anything': {
    id: 'a-person-with-a-week-without-checking-anything',
    the_thing: 'someone\'s out-of-office that means it, for a week, without a slack workaround',
    why_unspoken: 'envying this means admitting the subject would not actually use the week well',
  },
};

const STATE_TO_ENVY: Record<string, EnvyTargetId[]> = {
  'silent-burnout':                  ['friend-whose-weekend-looked-rested', 'a-stranger-with-time'],
  'overwhelmed-founder':             ['old-friend-still-in-the-same-job', 'a-stranger-with-time'],
  'startup-burnout':                 ['a-person-with-a-week-without-checking-anything'],
  'parent-overload':                 ['parent-at-school-gate-looking-unhurried', 'partner-of-a-friend-who-cooks'],
  'partner-overload':                ['partner-of-a-friend-who-cooks'],
  'overconnected-exhaustion':        ['colleague-who-said-no'],
  'sunday-anxiety':                  ['friend-whose-weekend-looked-rested'],
  'emotionally-drained':             ['sibling-replying-without-dread', 'someone-whose-parents-call-without-occasion'],
  'always-on-anxiety':               ['colleague-who-said-no'],
  'workday-blur':                    ['old-friend-still-in-the-same-job'],
};

const SOCIAL_MEDIA_LANGUAGE = /\b(instagram|tiktok|feed|story|reel|post|grid|aesthetic|highlight reel|on the internet)\b/i;
const LUXURY_ENVY = /\b(money|wealth|rich|expensive|villa|business class|first class|penthouse|yacht)\b/i;

export interface InvisibleEnvyReading {
  primary: EnvyTargetRecord | null;
  /** 0..10 — how specific the envy target is (specific = real). */
  envy_specificity: number;
  /** 0..10 — how unnamed the envy is in the truth (10 = catches by inference). */
  envy_unspoken_ness: number;
  /** 0..10 — closeness to social-platform comparison. */
  social_media_contamination: number;
  /** 0..10 — closeness to luxury envy (forbidden). */
  luxury_envy_contamination: number;
  notes: string[];
}

export interface InvisibleEnvyInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readInvisibleEnvy(input: InvisibleEnvyInput): InvisibleEnvyReading {
  const { state, truth } = input;
  const notes: string[] = [];

  const id = STATE_TO_ENVY[state.id]?.[0] ?? null;
  const primary = id ? ENVY_LIBRARY[id] : null;

  const text = truth.truth;
  const social_media_contamination = SOCIAL_MEDIA_LANGUAGE.test(text) ? 8 : 1;
  const luxury_envy_contamination = LUXURY_ENVY.test(text) ? 8 : 1;

  // Specificity: high when the truth includes specific markers (named
  // person, age, time, role). Low if generic.
  const SPECIFIC = /\b(friend|peer|sibling|parent|colleague|stranger|partner|teacher|neighbour)\b/i.test(text)
                && /\b(at \d{2}:\d{2}|on (sunday|monday|tuesday|wednesday|thursday|friday|saturday)|at the school|at the gate|at the office|on slack)\b/i.test(text);
  let envy_specificity = primary ? 5 : 0;
  if (SPECIFIC) envy_specificity += 4;
  envy_specificity = clamp10(envy_specificity);

  // Unspoken: high when truth does NOT use the word "envy" / "jealous".
  const NAMED_ENVY = /\b(envy|envious|jealous|jealousy)\b/i.test(text);
  const envy_unspoken_ness = NAMED_ENVY ? 2 : (primary ? 8 : 0);

  if (primary) notes.push(`invisible envy: ${primary.id} — "${primary.the_thing}"`);
  if (NAMED_ENVY) notes.push('truth names envy directly — banner loses the cinematic value of the unspoken');
  if (social_media_contamination >= 5) notes.push('WARNING: envy is framed in platform-comparison vocabulary');
  if (luxury_envy_contamination >= 5) notes.push('WARNING: envy is framed as luxury — Phase 20 forbids luxury envy');

  return { primary, envy_specificity, envy_unspoken_ness, social_media_contamination, luxury_envy_contamination, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
