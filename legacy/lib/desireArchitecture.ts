/**
 * DESIRE ARCHITECTURE (Phase 20)
 *
 * Maps a candidate banner to a STRUCTURAL DESIRE — not a marketing
 * desire ("want this product"), but a psychological-gravity desire
 * (an emotional pull operating beneath the conscious want).
 *
 * Different from Phase 5 emotionalCore (the FEELING), Phase 13
 * realityPressure (the COST), and Phase 19 identityMaintenance (the
 * ROLE being preserved). Phase 20 desire architecture answers a
 * separate question: "what is the body REACHING TOWARD, and is the
 * reach inevitable or manufactured?"
 *
 * Ten structural desire kinds the engine watches for, none of them
 * coded as "premium" or "luxury" — psychological gravity instead.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type DesireKindId =
  | 'permission-to-stop'
  | 'permission-to-feel'
  | 'unobserved-existence'
  | 'reliable-quiet'
  | 'being-known-without-explaining'
  | 'a-self-that-is-not-needed'
  | 'a-room-that-is-not-asked-for'
  | 'a-version-of-now-that-is-enough'
  | 'an-end-to-the-list'
  | 'a-body-that-feels-like-itself';

export interface DesireKindRecord {
  id: DesireKindId;
  the_reach: string;                   // what the body is reaching for
  why_psychological: string;            // why it operates beneath conscious want
  forbidden_framing: string;            // the influencer / luxury version we refuse
}

export const DESIRE_LIBRARY: Record<DesireKindId, DesireKindRecord> = {
  'permission-to-stop': {
    id: 'permission-to-stop',
    the_reach: 'someone — anything — telling the body that stopping does not cost anything important',
    why_psychological: 'the body cannot stop on its own because the identity has been built on continuation',
    forbidden_framing: '"you deserve a break" / "treat yourself" / "rest is productive"',
  },
  'permission-to-feel': {
    id: 'permission-to-feel',
    the_reach: 'permission to have the actual feeling without performing it as a story',
    why_psychological: 'modern social field demands the feeling come with an explanation, a hashtag, an arc',
    forbidden_framing: '"let yourself feel" / "honor your truth" / "vulnerability is strength"',
  },
  'unobserved-existence': {
    id: 'unobserved-existence',
    the_reach: 'a minute of being a body that nobody is reading',
    why_psychological: 'being constantly readable to family/colleagues/algorithm has become the default operating mode',
    forbidden_framing: '"digital detox" / "unplug" / "be present"',
  },
  'reliable-quiet': {
    id: 'reliable-quiet',
    the_reach: 'a quiet that can be counted on — not earned, not rationed, not requested',
    why_psychological: 'silence has become a thing the day has to be negotiated for, not a default',
    forbidden_framing: '"find your stillness" / "embrace the silence" / "quiet luxury"',
  },
  'being-known-without-explaining': {
    id: 'being-known-without-explaining',
    the_reach: 'somebody who already knows — no preamble, no caveats, no caught-up required',
    why_psychological: 'all current relationships require maintenance to stay current; nothing is at rest',
    forbidden_framing: '"your tribe" / "soul family" / "people who get you"',
  },
  'a-self-that-is-not-needed': {
    id: 'a-self-that-is-not-needed',
    the_reach: 'a version of the self that is not standing in for anyone, holding anything, providing anything',
    why_psychological: 'the body has been needed by something — kid, team, partner, calendar — for so long the unneeded-self has faded',
    forbidden_framing: '"reclaim yourself" / "self-discovery" / "remember who you are"',
  },
  'a-room-that-is-not-asked-for': {
    id: 'a-room-that-is-not-asked-for',
    the_reach: 'a space that is unconditionally theirs — not borrowed time, not stolen minutes, not negotiated quiet',
    why_psychological: 'every space the body has access to has a cost the body pays to occupy it',
    forbidden_framing: '"your sanctuary" / "she shed" / "the room of your own"',
  },
  'a-version-of-now-that-is-enough': {
    id: 'a-version-of-now-that-is-enough',
    the_reach: 'a now in which what is already true is sufficient',
    why_psychological: 'the day has been measured against an improved future-self for so long the present has lost authority',
    forbidden_framing: '"you are enough" / "be present" / "the now"',
  },
  'an-end-to-the-list': {
    id: 'an-end-to-the-list',
    the_reach: 'a moment in which there is genuinely nothing left to do',
    why_psychological: 'the to-do field has no terminus — completion was redefined as the start of the next list',
    forbidden_framing: '"productivity reset" / "inbox zero" / "the perfect system"',
  },
  'a-body-that-feels-like-itself': {
    id: 'a-body-that-feels-like-itself',
    the_reach: 'a body that recognises itself — not the optimised one, not the photographed one, not the on-tone one',
    why_psychological: 'the body has been styled for so many separate audiences the baseline body has been forgotten',
    forbidden_framing: '"glow" / "best self" / "feeling yourself again"',
  },
};

const STATE_TO_DESIRE: Record<string, DesireKindId[]> = {
  'silent-burnout':                  ['permission-to-stop', 'unobserved-existence'],
  'startup-burnout':                 ['an-end-to-the-list', 'permission-to-stop'],
  'overwhelmed-founder':             ['a-self-that-is-not-needed', 'permission-to-stop'],
  'overconnected-exhaustion':        ['unobserved-existence', 'reliable-quiet'],
  'mentally-absent':                 ['permission-to-feel', 'a-body-that-feels-like-itself'],
  'parent-overload':                 ['a-room-that-is-not-asked-for', 'a-self-that-is-not-needed'],
  'partner-overload':                ['a-room-that-is-not-asked-for'],
  'social-load-exhaustion':          ['unobserved-existence'],
  'always-on-anxiety':               ['reliable-quiet', 'an-end-to-the-list'],
  'sunday-anxiety':                  ['an-end-to-the-list', 'a-version-of-now-that-is-enough'],
  'before-meeting-panic':            ['permission-to-stop'],
  'emotionally-drained':             ['being-known-without-explaining', 'permission-to-feel'],
  'late-afternoon-collapse':         ['permission-to-stop'],
  'restless-night':                  ['reliable-quiet'],
  'workday-blur':                    ['a-version-of-now-that-is-enough'],
};

const CORE_TO_DESIRE: Partial<Record<string, DesireKindId>> = {
  'silent-burnout':                 'permission-to-stop',
  'invisible-pressure':             'a-version-of-now-that-is-enough',
  'hidden-anxiety':                 'reliable-quiet',
  'emotional-numbness':             'a-body-that-feels-like-itself',
  'social-mask-fatigue':            'being-known-without-explaining',
  'always-improving':               'a-version-of-now-that-is-enough',
  'too-tired-to-rest':              'permission-to-stop',
  'optimization-pressure':          'a-body-that-feels-like-itself',
};

const FORBIDDEN_FRAMING_RX = /\b(you deserve|treat yourself|self[- ]care|honor your truth|vulnerability is strength|digital detox|unplug|find your stillness|quiet luxury|your tribe|soul family|reclaim yourself|self[- ]discovery|your sanctuary|she shed|you are enough|be present|inbox zero|glow|best self)\b/i;

export interface DesireArchitectureReading {
  primary: DesireKindRecord | null;
  secondary: DesireKindRecord | null;
  /** 0..10 — how strongly the desire reads as psychological gravity. */
  desire_gravity: number;
  /** 0..10 — how inevitable (not manufactured) the desire is. */
  emotional_inevitability: number;
  /** True when the truth uses influencer / luxury / wellness vocabulary. */
  uses_forbidden_framing: boolean;
  notes: string[];
}

export interface DesireArchitectureInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readDesireArchitecture(input: DesireArchitectureInput): DesireArchitectureReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: DesireKindId[] = [];
  for (const id of STATE_TO_DESIRE[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_DESIRE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? DESIRE_LIBRARY[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? DESIRE_LIBRARY[candidates[1]]
    : null;

  const uses_forbidden_framing = FORBIDDEN_FRAMING_RX.test(truth.truth);

  let desire_gravity = 0;
  if (primary) desire_gravity += 6;
  if (secondary) desire_gravity += 1.5;
  if (uses_forbidden_framing) desire_gravity -= 4;
  desire_gravity = clamp10(desire_gravity);

  let emotional_inevitability = 0;
  if (primary) emotional_inevitability = 7;
  if (uses_forbidden_framing) emotional_inevitability -= 5;
  emotional_inevitability = clamp10(emotional_inevitability);

  if (primary) notes.push(`structural desire: ${primary.id} — "${primary.the_reach}"`);
  else notes.push('no structural desire identified — banner shows a state without a reach');
  if (uses_forbidden_framing) notes.push('WARNING: truth uses influencer / wellness / luxury vocabulary');

  return { primary, secondary, desire_gravity, emotional_inevitability, uses_forbidden_framing, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
