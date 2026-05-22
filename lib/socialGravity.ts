/**
 * SOCIAL GRAVITY (Phase 21)
 *
 * The invisible pull a collective field exerts on an individual.
 * Not "social pressure" in the obvious sense, but the QUIET WEIGHT
 * of being a body inside a collective emotional weather.
 *
 * Phase 21's central insight: a feeling that exists in one human is
 * usually a feeling that already exists in many. Catching the
 * collective allows the individual photograph to land as "us"
 * rather than "her" / "him" / "i".
 *
 * Different from Phase 12 sharedCulturalMemory (the named pattern)
 * and Phase 21 collectiveEmotionalMovement (the MOVEMENT). Phase 21
 * socialGravity is the STATIC PULL — the standing wave the
 * individual is operating inside.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type SocialFieldId =
  | 'ambient-availability'
  | 'collective-overstimulation'
  | 'shared-low-grade-dread'
  | 'group-productivity-pressure'
  | 'parental-cohort-comparison'
  | 'professional-cohort-comparison'
  | 'wellness-cohort-pressure'
  | 'cultural-mood-of-the-week'
  | 'ambient-loneliness'
  | 'shared-deferred-rest';

export interface SocialFieldRecord {
  id: SocialFieldId;
  the_field: string;
  what_the_body_feels: string;
  how_it_pulls: string;
}

export const SOCIAL_FIELDS: Record<SocialFieldId, SocialFieldRecord> = {
  'ambient-availability': {
    id: 'ambient-availability',
    the_field: 'the cultural baseline expectation that messages arrive read within hours',
    what_the_body_feels: 'a soft permanent alertness even when nothing is being asked',
    how_it_pulls: 'the body checks before it has been asked to check',
  },
  'collective-overstimulation': {
    id: 'collective-overstimulation',
    the_field: 'the city / the workplace / the feed running at intensities none of the individuals chose',
    what_the_body_feels: 'a low-grade buzz that does not belong to any specific thing',
    how_it_pulls: 'the body matches the intensity of the field around it',
  },
  'shared-low-grade-dread': {
    id: 'shared-low-grade-dread',
    the_field: 'a culture\'s background dread — economic, climate, geopolitical — that nobody is talking about today specifically',
    what_the_body_feels: 'a small drag on every plan, an unwillingness to commit far out',
    how_it_pulls: 'the body discounts the future and over-weights the next 48 hours',
  },
  'group-productivity-pressure': {
    id: 'group-productivity-pressure',
    the_field: 'a workplace where the team\'s observable output is the team\'s only currency',
    what_the_body_feels: 'a low pressure to be visibly working at any given moment',
    how_it_pulls: 'the body performs visible work even when capacity is gone',
  },
  'parental-cohort-comparison': {
    id: 'parental-cohort-comparison',
    the_field: 'a cohort of parents — the school WhatsApp group, the friends from prenatal — all of whom appear to be doing this with less strain',
    what_the_body_feels: 'a small inadequacy with no specific cause',
    how_it_pulls: 'the body adopts the cohort\'s standard as its own — sleep training, lunch presentation, weekend trips',
  },
  'professional-cohort-comparison': {
    id: 'professional-cohort-comparison',
    the_field: 'a peer cohort — old colleagues, classmates, founder friends — all updating LinkedIn at intervals',
    what_the_body_feels: 'a quiet sense of falling behind without a clear race',
    how_it_pulls: 'the body adopts the cohort\'s tempo even when the body\'s context does not justify it',
  },
  'wellness-cohort-pressure': {
    id: 'wellness-cohort-pressure',
    the_field: 'a cohort that talks about sleep / strength / meditation / sourdough',
    what_the_body_feels: 'a low pressure to be optimising something publicly',
    how_it_pulls: 'the body picks up a practice without examining whether it wants it',
  },
  'cultural-mood-of-the-week': {
    id: 'cultural-mood-of-the-week',
    the_field: 'whatever this week\'s collective emotional weather is — a strike, a news cycle, a season change, a TV finale',
    what_the_body_feels: 'a mood the body cannot fully account for from its own week',
    how_it_pulls: 'the body absorbs the collective tone without consenting',
  },
  'ambient-loneliness': {
    id: 'ambient-loneliness',
    the_field: 'a culture where most people\'s loneliness is invisible to most other people',
    what_the_body_feels: 'a small isolation that does not match the calendar density',
    how_it_pulls: 'the body keeps reaching for the phone for company that the phone cannot provide',
  },
  'shared-deferred-rest': {
    id: 'shared-deferred-rest',
    the_field: 'an entire cohort deferring rest to the next holiday / next month / next year',
    what_the_body_feels: 'a normalisation of running at deficit',
    how_it_pulls: 'the body stops registering rest as available, because nobody around it is taking any',
  },
};

const STATE_TO_FIELD: Record<string, SocialFieldId[]> = {
  'overconnected-exhaustion':        ['ambient-availability', 'ambient-loneliness'],
  'overstimulated-office':           ['collective-overstimulation', 'group-productivity-pressure'],
  'always-on-anxiety':               ['ambient-availability'],
  'silent-burnout':                  ['group-productivity-pressure', 'shared-deferred-rest'],
  'startup-burnout':                 ['professional-cohort-comparison', 'shared-deferred-rest'],
  'overwhelmed-founder':             ['professional-cohort-comparison'],
  'sunday-anxiety':                  ['cultural-mood-of-the-week', 'shared-deferred-rest'],
  'parent-overload':                 ['parental-cohort-comparison'],
  'partner-overload':                ['ambient-loneliness'],
  'unread-messages-anxiety':         ['ambient-availability'],
  'restless-night':                  ['shared-low-grade-dread'],
  'doomscroll-fatigue':              ['shared-low-grade-dread', 'cultural-mood-of-the-week'],
};

const INDIVIDUAL_PHRASING = /\b(i (am|was)|my|me|myself)\b/i;
const COLLECTIVE_PHRASING = /\b(they|them|people|everyone|a generation|us|all of us|we|nobody)\b/i;

export interface SocialGravityReading {
  primary: SocialFieldRecord | null;
  /** 0..10 — strength of the social-field pull. */
  gravity_strength: number;
  /** 0..10 — how much the truth places the individual inside the collective. */
  collective_grounding: number;
  /** True when the truth is phrased only at the individual level. */
  individually_dramatized: boolean;
  notes: string[];
}

export interface SocialGravityInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readSocialGravity(input: SocialGravityInput): SocialGravityReading {
  const { state, truth } = input;
  const notes: string[] = [];

  const id = STATE_TO_FIELD[state.id]?.[0] ?? null;
  const primary = id ? SOCIAL_FIELDS[id] : null;

  const text = truth.truth;
  const usesIndividual = INDIVIDUAL_PHRASING.test(text);
  const usesCollective = COLLECTIVE_PHRASING.test(text);

  let collective_grounding = 0;
  if (usesCollective) collective_grounding += 6;
  if (usesIndividual && !usesCollective) collective_grounding -= 3;
  collective_grounding = clamp10(collective_grounding);

  let gravity_strength = primary ? 6 : 0;
  gravity_strength += collective_grounding / 3;
  gravity_strength = clamp10(gravity_strength);

  const individually_dramatized = usesIndividual && !usesCollective && (primary !== null);

  if (primary) notes.push(`social field: ${primary.id} — "${primary.the_field}"`);
  if (individually_dramatized) notes.push('WARNING: truth is dramatized individually — social field present but ungrounded');

  return { primary, gravity_strength, collective_grounding, individually_dramatized, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
