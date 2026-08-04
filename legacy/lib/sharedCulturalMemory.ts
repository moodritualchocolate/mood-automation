/**
 * SHARED CULTURAL MEMORY (Phase 12)
 *
 * Phase 5's culturalMemory.ts encoded BUILT-WORLD micro-moments —
 * the physical situations where emotions live.
 *
 * Phase 12 encodes COLLECTIVE EMOTIONAL PATTERNS — the tensions
 * an entire generation experiences but rarely names. The spec named
 * them as cultural states, not as ad concepts:
 *
 *   "A generation that cannot rest without feeling guilty."
 *   "People who open phones from anxiety, not desire."
 *   "People who do not know if they are working or just unable to stop."
 *
 * The engine matches a candidate banner against these patterns and
 * reports which collective tension the banner touches. The next
 * stage (collectiveRecognition) scores whether multiple strangers
 * would feel "this is about us".
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export interface CulturalPattern {
  id: string;
  generation_scope: 'millennial' | 'gen-z' | 'cross-generational' | 'parent-cohort' | 'startup-cohort' | 'reservist-cohort';
  named_tension: string;
  unspoken_sentence: string;
  cultural_symptoms: string[];
  /** Emotional cores this pattern is most likely to live inside. */
  core_anchors: string[];
  /** ENERGY state slugs that fit the pattern. */
  state_anchors: string[];
  /** What the campaign should AVOID when expressing this pattern
   *  (clichés that have already consumed it). */
  consumed_treatments: string[];
}

export const SHARED_CULTURAL_PATTERNS: CulturalPattern[] = [
  {
    id: 'cannot-rest-without-guilt',
    generation_scope: 'millennial',
    named_tension: 'a generation that cannot rest without feeling guilty',
    unspoken_sentence: 'if I sit down for fifteen minutes, I am behind',
    cultural_symptoms: ['cleaning instead of resting', 'opening the laptop on a day off', 'feeling watched by an empty room'],
    core_anchors: ['silent-burnout', 'invisible-pressure', 'guilt', 'depletion'],
    state_anchors: ['startup-burnout', 'pressure-fatigue', 'forced-productivity', 'tired-but-continuing'],
    consumed_treatments: ['warm bath + candle wellness pitch', 'productivity-detox motif'],
  },
  {
    id: 'phone-from-anxiety',
    generation_scope: 'cross-generational',
    named_tension: 'people who open phones from anxiety, not desire',
    unspoken_sentence: 'I do not want to look at this and I cannot put it down',
    cultural_symptoms: ['compulsive lock-screen check', 'scrolling without comprehension', 'app-tile rotation'],
    core_anchors: ['doomscrolling', 'digital-fatigue', 'hidden-anxiety'],
    state_anchors: ['doomscroll-fatigue', 'exhausted-scrolling', 'constant-notifications', 'overconnected-exhaustion'],
    consumed_treatments: ['detox-retreat aesthetic', 'screen-time-anxiety infographic'],
  },
  {
    id: 'working-or-cannot-stop',
    generation_scope: 'startup-cohort',
    named_tension: 'people who no longer know if they are working or just unable to stop',
    unspoken_sentence: 'if I close this tab, I will not know what to do with myself',
    cultural_symptoms: ['working past the point of usefulness', 'restless after closing the laptop', 'phantom-task-list at 23:30'],
    core_anchors: ['silent-burnout', 'invisible-pressure', 'too-tired-to-rest', 'functional-collapse'],
    state_anchors: ['startup-burnout', 'overwhelmed-founder', 'tired-ambition', 'forced-productivity'],
    consumed_treatments: ['inspirational-founder portrait', 'hustle-vs-recovery wellness pitch'],
  },
  {
    id: 'overconnected-unreachable',
    generation_scope: 'cross-generational',
    named_tension: 'available to forty people, unavailable to themselves',
    unspoken_sentence: 'I have not been alone with myself today',
    cultural_symptoms: ['slack thread responsiveness', 'phone face-up on bedside', 'reply latency anxiety'],
    core_anchors: ['overconnected-exhaustion', 'loneliness-in-public', 'social-performance-exhaustion'],
    state_anchors: ['overconnected-exhaustion', 'social-exhaustion', 'low-social-battery', 'mentally-absent'],
    consumed_treatments: ['phones-stacked-at-dinner trope', 'analog-revival nostalgia'],
  },
  {
    id: 'achievement-numbness',
    generation_scope: 'millennial',
    named_tension: 'people who hit their goals and feel nothing',
    unspoken_sentence: 'I waited a long time for this and it has not arrived in my chest',
    cultural_symptoms: ['promotion that felt flat', 'finished project, no relief', 'birthday that did not land'],
    core_anchors: ['emotional-numbness', 'emotional-drift', 'silent-burnout'],
    state_anchors: ['mentally-absent', 'emotional-numbness', 'tired-ambition'],
    consumed_treatments: ['celebrate-the-wins reel', 'self-love montage'],
  },
  {
    id: 'sunday-anxiety',
    generation_scope: 'cross-generational',
    named_tension: 'people for whom Sunday evening is already Monday',
    unspoken_sentence: 'the weekend ended hours before I went to bed',
    cultural_symptoms: ['inbox-check at 21:00', 'calendar review on the couch', 'mental rehearsal of tomorrow'],
    core_anchors: ['hidden-anxiety', 'guilt', 'invisible-pressure'],
    state_anchors: ['sunday-anxiety', 'before-meeting-panic'],
    consumed_treatments: ['Monday-morning-empowerment campaign', 'meal-prep Sunday lifestyle'],
  },
  {
    id: 'post-notification-emptiness',
    generation_scope: 'gen-z',
    named_tension: 'the small drop after a notification that did not deliver what was hoped for',
    unspoken_sentence: 'I wanted that to matter more',
    cultural_symptoms: ['phone in hand, expression unchanged', 'three apps open, none of them watched', 'unread count not changing the mood'],
    core_anchors: ['digital-fatigue', 'emotional-numbness', 'overstimulated-but-flat'],
    state_anchors: ['constant-notifications', 'doomscroll-fatigue', 'attention-fragmentation'],
    consumed_treatments: ['#dopamine-detox aesthetic', 'app-deletion virtue signal'],
  },
  {
    id: 'doomscroll-dissociation',
    generation_scope: 'cross-generational',
    named_tension: 'people who scroll past tragedy without flinching, then feel nothing about that either',
    unspoken_sentence: 'I should be more affected by this',
    cultural_symptoms: ['news-feed scroll over disaster headlines', 'expression unchanged at upsetting reel', 'going to bed after that without comment'],
    core_anchors: ['emotional-numbness', 'digital-fatigue', 'doomscrolling'],
    state_anchors: ['doomscroll-fatigue', 'exhausted-scrolling', 'mentally-checked-out'],
    consumed_treatments: ['news-overload editorial campaign', 'mindfulness-app pitch'],
  },
  {
    id: 'loneliness-while-connected',
    generation_scope: 'gen-z',
    named_tension: 'connected to hundreds, known by few',
    unspoken_sentence: 'all of these people, none of them know that today was hard',
    cultural_symptoms: ['feed scroll while a friend is on the other line', 'meme exchange that did not land', 'liking without reading'],
    core_anchors: ['loneliness-in-public', 'overconnected-exhaustion', 'social-performance-exhaustion'],
    state_anchors: ['social-exhaustion', 'overconnected-exhaustion', 'low-social-battery'],
    consumed_treatments: ['"go outside and touch grass" meme aesthetic'],
  },
  {
    id: 'parent-of-young-children-collapse',
    generation_scope: 'parent-cohort',
    named_tension: 'parents who lose themselves between school pickup and dinner',
    unspoken_sentence: 'I have not been alone in my own head since Monday',
    cultural_symptoms: ['sat on the kitchen floor at 21:00', 'phone scroll in the bathroom alone', 'wine glass that did not get poured'],
    core_anchors: ['depletion', 'invisible-pressure', 'social-performance-exhaustion'],
    state_anchors: ['exhausted-parenting', 'pressure-fatigue', 'social-exhaustion'],
    consumed_treatments: ['mom-bond Instagram aesthetic', 'parent-burnout self-help'],
  },
  {
    id: 'post-miluim-reentry',
    generation_scope: 'reservist-cohort',
    named_tension: 'reservists who return home and cannot return to themselves',
    unspoken_sentence: 'the body is home, the rest of me has not landed',
    cultural_symptoms: ['uniform half-folded on a chair', 'over-react to a kitchen sound', 'cannot finish a sentence about what just happened'],
    core_anchors: ['inability-to-land', 'depletion', 'silent-burnout'],
    state_anchors: ['startup-burnout', 'pressure-fatigue', 'emotionally-drained'],
    consumed_treatments: ['heroic-flag-silhouette campaign', 'reunion stock photography'],
  },
  {
    id: 'productivity-guilt-shabbat',
    generation_scope: 'cross-generational',
    named_tension: 'people who cannot rest on Saturday because rest now requires a permission slip',
    unspoken_sentence: 'I should be doing something useful',
    cultural_symptoms: ['Saturday inbox check', 'guilt-driven cleaning instead of resting', 'list-making on a day with no list'],
    core_anchors: ['guilt', 'silent-burnout', 'invisible-pressure'],
    state_anchors: ['sunday-anxiety', 'pressure-fatigue', 'forced-productivity'],
    consumed_treatments: ['"romanticize Saturday" lifestyle reel', 'soft-Saturday content aesthetic'],
  },
];

/**
 * Match a candidate banner against the shared cultural pattern bank.
 * Returns the strongest match — or null when no pattern fits the
 * intersection of emotional core × state.
 */
export function matchSharedCulturalPattern(args: {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
}): { pattern: CulturalPattern | null; strength: number } {
  const { state, emotionalCore } = args;
  let best: { pattern: CulturalPattern; strength: number } | null = null;

  for (const pattern of SHARED_CULTURAL_PATTERNS) {
    let strength = 0;
    if (emotionalCore && pattern.core_anchors.includes(emotionalCore.id)) strength += 5;
    if (pattern.state_anchors.includes(state.id)) strength += 4;
    if (strength > 0 && (!best || strength > best.strength)) best = { pattern, strength };
  }

  if (!best) return { pattern: null, strength: 0 };
  return best;
}
