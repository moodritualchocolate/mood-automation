/**
 * HUMAN CONTRADICTION (Phase 11)
 *
 * Humans contradict themselves all the time. The spec named the
 * examples:
 *
 *   exhausted but scrolling
 *   lonely but avoiding people
 *   overstimulated but seeking stimulation
 *   wants sleep but opens laptop
 *   burnout but performs productivity
 *
 * The system must learn: contradiction generates recognition. Not
 * clarity.
 *
 * Phase 9 already had `emotionalContradiction.ts` — but that scored
 * LITERARY contradictions (energized but lonely). Phase 11's
 * humanContradiction names BEHAVIORAL contradictions: what is the
 * body actually doing, simultaneously, that contradicts the emotional
 * state?
 *
 * The decision is consumed by the image brief as a "body-behaviour
 * pair" — the subject does X while feeling Y, and the camera catches
 * both at once.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export interface BehavioralContradiction {
  id: string;
  feeling: string;          // the inner state
  behavior: string;         // the visible behavior that contradicts it
  director_note: string;    // how the camera catches both
}

const LIBRARY: BehavioralContradiction[] = [
  {
    id: 'exhausted-but-scrolling',
    feeling: 'exhausted',
    behavior: 'still scrolling',
    director_note: 'the thumb keeps moving, the eyes have stopped registering',
  },
  {
    id: 'lonely-but-avoiding-people',
    feeling: 'lonely',
    behavior: 'declining the invitation',
    director_note: 'the door is open, the subject is not getting up',
  },
  {
    id: 'overstimulated-but-seeking-stimulation',
    feeling: 'overstimulated',
    behavior: 'opening another tab',
    director_note: 'the hand opens a new window the brain has not asked for',
  },
  {
    id: 'wants-sleep-but-opens-laptop',
    feeling: 'wants sleep',
    behavior: 'opens the laptop',
    director_note: 'the lid lifts; sleep is now a decision the subject postponed',
  },
  {
    id: 'burnout-but-performs-productivity',
    feeling: 'burnt out',
    behavior: 'looks composed in the meeting',
    director_note: 'the posture is upright, the eyes are not',
  },
  {
    id: 'guilty-but-not-replying',
    feeling: 'guilty about the unread message',
    behavior: 'phone stays face-down',
    director_note: 'the obligation is closer than the device',
  },
  {
    id: 'tired-but-not-leaving',
    feeling: 'depleted at the party',
    behavior: 'pouring another drink',
    director_note: 'the social cost has been paid; the body is still buying time',
  },
  {
    id: 'needs-rest-but-cleans',
    feeling: 'needs rest',
    behavior: 'cleans the counter instead',
    director_note: 'the body picks the easier task; rest is harder than wiping a surface',
  },
  {
    id: 'wants-quiet-but-keeps-music-on',
    feeling: 'wants quiet',
    behavior: 'leaves a podcast playing',
    director_note: 'silence is too much; voice in the room is the compromise',
  },
  {
    id: 'craves-stillness-but-walks',
    feeling: 'craves stillness',
    behavior: 'walks around the block',
    director_note: 'the body moves because the mind cannot stop',
  },
];

const CORE_TO_CONTRADICTION: Partial<Record<EmotionalCore['id'], string>> = {
  'doomscrolling':                   'exhausted-but-scrolling',
  'too-tired-to-rest':               'wants-sleep-but-opens-laptop',
  'revenge-bedtime-procrastination': 'wants-sleep-but-opens-laptop',
  'silent-burnout':                  'burnout-but-performs-productivity',
  'loneliness-in-public':            'lonely-but-avoiding-people',
  'social-performance-exhaustion':   'tired-but-not-leaving',
  'overstimulated-but-flat':         'overstimulated-but-seeking-stimulation',
  'emotional-fragmentation':         'overstimulated-but-seeking-stimulation',
  'guilt':                           'guilty-but-not-replying',
  'avoidance':                       'lonely-but-avoiding-people',
  'depletion':                       'needs-rest-but-cleans',
  'emotional-drift':                 'craves-stillness-but-walks',
  'inability-to-land':               'craves-stillness-but-walks',
};

export interface HumanContradictionReading {
  pair: BehavioralContradiction | null;
  /** True when the candidate banner inhabits a contradiction rather
   *  than resolving it. */
  inhabits_contradiction: boolean;
  /** 0..10 — how strongly the candidate is rooted in the contradiction. */
  recognition_score: number;
  /** True when the system tried to RESOLVE the contradiction (the
   *  truth says "X, and also Y" instead of "X while Y"). */
  resolved_too_cleanly: boolean;
  briefLine: string;
}

export interface HumanContradictionInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  truthText: string;
}

export function readHumanContradiction(input: HumanContradictionInput): HumanContradictionReading {
  const { state, emotionalCore, truthText } = input;

  let pair: BehavioralContradiction | null = null;
  if (emotionalCore) {
    const id = CORE_TO_CONTRADICTION[emotionalCore.id];
    if (id) pair = LIBRARY.find((p) => p.id === id) ?? null;
  }
  // Fallback by state family — the families map roughly to contradictions
  // even when no emotional core was resolved.
  if (!pair) {
    if (state.family === 'fatigue' || state.family === 'collapse') pair = LIBRARY.find((p) => p.id === 'needs-rest-but-cleans')!;
    else if (state.family === 'numbness') pair = LIBRARY.find((p) => p.id === 'craves-stillness-but-walks')!;
    else if (state.family === 'overstimulation') pair = LIBRARY.find((p) => p.id === 'overstimulated-but-seeking-stimulation')!;
    else if (state.family === 'pressure') pair = LIBRARY.find((p) => p.id === 'burnout-but-performs-productivity')!;
    else if (state.family === 'avoidance') pair = LIBRARY.find((p) => p.id === 'lonely-but-avoiding-people')!;
  }

  // resolved_too_cleanly — when the truth uses connectives that close
  // the loop ("and now I feel better", "but now I am ready", "—
  // finally I…") it has resolved the contradiction.
  const resolvedPatterns = /\b(and now|but now|finally|at last|in the end|i decided to|i finally)\b/i;
  const resolved_too_cleanly = resolvedPatterns.test(truthText);

  const inhabits_contradiction = pair !== null && !resolved_too_cleanly;

  // Recognition score — high when the pair exists AND the truth does
  // not resolve it.
  let recognition_score = 3;
  if (pair) recognition_score += 4;
  if (inhabits_contradiction) recognition_score += 2.5;
  if (resolved_too_cleanly) recognition_score -= 3;
  recognition_score = Math.max(0, Math.min(10, recognition_score));

  const briefLine = pair
    ? `Behavioral contradiction (the camera catches both at once): the subject is ${pair.feeling} but ${pair.behavior}. ${pair.director_note}.`
    : 'No specific behavioral contradiction mapped — let the subject simply be one thing.';

  return { pair, inhabits_contradiction, recognition_score, resolved_too_cleanly, briefLine };
}
