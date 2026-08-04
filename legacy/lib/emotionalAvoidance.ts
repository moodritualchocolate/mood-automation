/**
 * EMOTIONAL AVOIDANCE (Phase 14)
 *
 * Most modern feelings do not get felt directly. They get
 * SUBSTITUTED — replaced by behavior that lets the person continue
 * functioning without ever touching the underlying state.
 *
 * The spec named seven avoidance mechanics:
 *
 *   productivity used to avoid emotion
 *   humor masking exhaustion
 *   constant motion masking anxiety
 *   over-responsiveness masking fear
 *   optimization as self-worth
 *   endless small tasks avoiding stillness
 *   phone checking avoiding internal silence
 *
 * The engine identifies which avoidance pattern the candidate banner
 * is most likely expressing. Match strength is high when the state
 * + emotional core + observable behaviour all point at the same
 * substitution.
 *
 * The verdict is consumed by the meta-critic: a banner that captures
 * BEHAVIOUR REPLACING FEELING is the spec's intended outcome; a
 * banner that names the feeling directly is rejected at brutal.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type AvoidancePattern =
  | 'productivity-avoiding-emotion'
  | 'humor-masking-exhaustion'
  | 'motion-masking-anxiety'
  | 'over-responsiveness-masking-fear'
  | 'optimization-as-self-worth'
  | 'small-tasks-avoiding-stillness'
  | 'phone-checking-avoiding-silence';

export interface AvoidanceRecord {
  id: AvoidancePattern;
  underlying_feeling: string;
  replacement_behavior: string;
  observable_signal: string;
  /** Soft hint to the image brief: what to look for in the scene. */
  briefHint: string;
}

export const AVOIDANCE_LIBRARY: Record<AvoidancePattern, AvoidanceRecord> = {
  'productivity-avoiding-emotion': {
    id: 'productivity-avoiding-emotion',
    underlying_feeling: 'a feeling that has not been named yet',
    replacement_behavior: 'opening another spreadsheet',
    observable_signal: 'the work is open at a time when nothing about work is the actual question',
    briefHint: 'subject visibly working at the wrong hour — the laptop is the answer to something else',
  },
  'humor-masking-exhaustion': {
    id: 'humor-masking-exhaustion',
    underlying_feeling: 'depleted past the point of explaining',
    replacement_behavior: 'making the joke before anyone can ask',
    observable_signal: 'a smile precisely-timed to deflect a question',
    briefHint: 'half-smile that arrived a half-second too early — defensive timing',
  },
  'motion-masking-anxiety': {
    id: 'motion-masking-anxiety',
    underlying_feeling: 'a low-grade dread without a name',
    replacement_behavior: 'walking, pacing, cleaning, restless errands',
    observable_signal: 'the body is doing something that does not need doing',
    briefHint: 'subject walking or rearranging without purpose — the body is the cover story',
  },
  'over-responsiveness-masking-fear': {
    id: 'over-responsiveness-masking-fear',
    underlying_feeling: 'fear of being judged for slowness',
    replacement_behavior: 'replying within 60 seconds, every time, on every channel',
    observable_signal: 'phone responsiveness disproportionate to actual stakes',
    briefHint: 'subject replying to a message of low urgency with full attention — the speed is the tell',
  },
  'optimization-as-self-worth': {
    id: 'optimization-as-self-worth',
    underlying_feeling: 'unsure of being enough',
    replacement_behavior: 'tracking sleep, steps, focus, screen time',
    observable_signal: 'the dashboard is the version of the self the subject can stand looking at',
    briefHint: 'visible self-tracking surface (wearable, app, journal) treated like evidence of worth',
  },
  'small-tasks-avoiding-stillness': {
    id: 'small-tasks-avoiding-stillness',
    underlying_feeling: 'cannot tolerate being alone with themselves',
    replacement_behavior: 'a sequence of small chores nobody asked for',
    observable_signal: 'each task takes 90 seconds; the total is hours; the room is no cleaner',
    briefHint: 'subject in the middle of a small task, surrounded by other half-done small tasks',
  },
  'phone-checking-avoiding-silence': {
    id: 'phone-checking-avoiding-silence',
    underlying_feeling: 'unbearable internal quiet',
    replacement_behavior: 'reaching for the phone before the quiet starts',
    observable_signal: 'lock screen pulled at any pause longer than three seconds',
    briefHint: 'subject mid-reach for the phone in a moment of stillness — the gesture is the tell',
  },
};

const STATE_TO_AVOIDANCE: Record<string, AvoidancePattern[]> = {
  'forced-productivity':      ['productivity-avoiding-emotion', 'optimization-as-self-worth'],
  'startup-burnout':          ['productivity-avoiding-emotion', 'over-responsiveness-masking-fear'],
  'overwhelmed-founder':      ['over-responsiveness-masking-fear', 'productivity-avoiding-emotion'],
  'fake-productivity':        ['productivity-avoiding-emotion', 'small-tasks-avoiding-stillness'],
  'restless-work-energy':     ['motion-masking-anxiety', 'small-tasks-avoiding-stillness'],
  'tab-switching-paralysis':  ['phone-checking-avoiding-silence', 'small-tasks-avoiding-stillness'],
  'too-many-tabs':            ['phone-checking-avoiding-silence', 'productivity-avoiding-emotion'],
  'constant-notifications':   ['phone-checking-avoiding-silence', 'over-responsiveness-masking-fear'],
  'overstimulated-office':    ['phone-checking-avoiding-silence', 'motion-masking-anxiety'],
  'doomscroll-fatigue':       ['phone-checking-avoiding-silence'],
  'mentally-absent':          ['humor-masking-exhaustion', 'over-responsiveness-masking-fear'],
  'social-exhaustion':        ['humor-masking-exhaustion'],
  'performance-fatigue':      ['humor-masking-exhaustion', 'over-responsiveness-masking-fear'],
  'overconnected-exhaustion': ['over-responsiveness-masking-fear', 'phone-checking-avoiding-silence'],
};

const CORE_TO_AVOIDANCE: Partial<Record<string, AvoidancePattern>> = {
  'silent-burnout':         'productivity-avoiding-emotion',
  'invisible-pressure':     'over-responsiveness-masking-fear',
  'hidden-anxiety':         'motion-masking-anxiety',
  'social-performance-exhaustion': 'humor-masking-exhaustion',
  'too-tired-to-rest':      'phone-checking-avoiding-silence',
  'digital-fatigue':        'phone-checking-avoiding-silence',
  'doomscrolling':          'phone-checking-avoiding-silence',
  'avoidance':              'small-tasks-avoiding-stillness',
  'guilt':                  'productivity-avoiding-emotion',
  'emotional-fragmentation':'phone-checking-avoiding-silence',
};

export interface AvoidanceReading {
  pattern: AvoidanceRecord | null;
  match_strength: number;            // 0..10
  /** True when the candidate banner captures behaviour replacing
   *  feeling — the spec's intended outcome. */
  behavior_replacing_feeling: boolean;
  /** True when the truth NAMES the feeling instead of showing the
   *  substitute. */
  feeling_named_directly: boolean;
  notes: string[];
}

export interface AvoidanceInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const NAMED_FEELING_PATTERN = /\b(i\s+(am|feel|was)|feeling|sad|anxious|lonely|burnt out|exhausted|stressed|depressed|overwhelmed|hopeless|broken)\b/i;
const BEHAVIORAL_PATTERN = /\b(opens|opened|closes|closed|reaches|reached|types|typed|walks|walked|sits|sat|stands|stood|scrolls|scrolled|checks|checked|answers|answered|replies|replied|laughs|laughed)\b/i;

export function readEmotionalAvoidance(input: AvoidanceInput): AvoidanceReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  // Strongest signal: state slug.
  let pattern: AvoidanceRecord | null = null;
  let match_strength = 0;
  const stateCandidates = STATE_TO_AVOIDANCE[state.id] ?? [];
  if (stateCandidates.length > 0) {
    pattern = AVOIDANCE_LIBRARY[stateCandidates[0]];
    match_strength = 7;
  }

  // Core fallback.
  if (!pattern && emotionalCore) {
    const id = CORE_TO_AVOIDANCE[emotionalCore.id];
    if (id) {
      pattern = AVOIDANCE_LIBRARY[id];
      match_strength = 6;
    }
  }

  // Family-based last resort.
  if (!pattern) {
    if (state.family === 'pressure') pattern = AVOIDANCE_LIBRARY['productivity-avoiding-emotion'];
    else if (state.family === 'fragmentation' || state.family === 'overstimulation') pattern = AVOIDANCE_LIBRARY['phone-checking-avoiding-silence'];
    else if (state.family === 'avoidance') pattern = AVOIDANCE_LIBRARY['small-tasks-avoiding-stillness'];
    else if (state.family === 'numbness') pattern = AVOIDANCE_LIBRARY['humor-masking-exhaustion'];
    if (pattern) match_strength = 4;
  }

  // ─── Check whether the truth names the feeling directly ─────
  const truthText = truth.truth;
  const feeling_named_directly = NAMED_FEELING_PATTERN.test(truthText);
  const behavior_named = BEHAVIORAL_PATTERN.test(truthText);
  const behavior_replacing_feeling = pattern !== null && behavior_named && !feeling_named_directly;

  if (feeling_named_directly) {
    notes.push('truth names the feeling directly — viewer is told, not shown');
  } else if (behavior_named) {
    notes.push('truth describes behavior — substitution is visible, feeling is implied');
  }
  if (pattern) notes.push(`avoidance pattern: ${pattern.id} (strength ${match_strength}/10)`);
  if (notes.length === 0) notes.push('no specific avoidance pattern matched');

  return { pattern, match_strength, behavior_replacing_feeling, feeling_named_directly, notes };
}
