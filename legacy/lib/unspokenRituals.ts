/**
 * UNSPOKEN MODERN RITUALS (Phase 12)
 *
 * Rituals modern people perform unconsciously. NOT props. NOT motifs.
 * Tiny repeated behaviors that nobody talks about but everyone does.
 *
 * The spec named:
 *   opening fridge without hunger
 *   switching apps without intention
 *   rechecking notifications instantly
 *   laptop reopen after shutdown
 *   watching reels while exhausted
 *   coffee without tasting it
 *   lying in bed but mentally working
 *   fake productivity loops
 *
 * The engine selects the ritual most likely to anchor the candidate
 * banner — the camera should catch the subject MID-RITUAL. The
 * recognition is in the gesture, not the truth.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalPattern } from './sharedCulturalMemory';

export interface UnspokenRitual {
  id: string;
  trigger: string;                  // what state of mind leads to it
  observable_action: string;        // what the camera sees
  hidden_meaning: string;           // what it actually is, beneath the gesture
  /** Suitable for these state families. */
  family_anchors: string[];
  /** Cultural patterns this ritual lives inside. */
  pattern_anchors: string[];
}

export const UNSPOKEN_RITUALS: UnspokenRitual[] = [
  {
    id: 'fridge-without-hunger',
    trigger: 'restlessness with no name',
    observable_action: 'opens the fridge, looks in, closes it without taking anything',
    hidden_meaning: 'looking for something that is not in the fridge',
    family_anchors: ['numbness', 'fatigue', 'fragmentation'],
    pattern_anchors: ['cannot-rest-without-guilt', 'achievement-numbness'],
  },
  {
    id: 'app-switching-without-intention',
    trigger: 'unbearable static between thoughts',
    observable_action: 'instagram → twitter → instagram → mail → instagram',
    hidden_meaning: 'avoiding the next decision',
    family_anchors: ['fragmentation', 'overstimulation'],
    pattern_anchors: ['phone-from-anxiety', 'doomscroll-dissociation', 'post-notification-emptiness'],
  },
  {
    id: 'rechecking-notifications',
    trigger: 'low-grade anxiety + nothing else to do',
    observable_action: 'thumb swipes down on the lock screen to re-pull notifications that have not arrived',
    hidden_meaning: 'asking the device to be the one to start the day',
    family_anchors: ['overstimulation', 'pressure', 'avoidance'],
    pattern_anchors: ['phone-from-anxiety', 'overconnected-unreachable'],
  },
  {
    id: 'laptop-reopen-after-shutdown',
    trigger: 'cannot leave work behind',
    observable_action: 'closes the laptop, sits down on the couch, reopens it within four minutes',
    hidden_meaning: 'the day refused to be done',
    family_anchors: ['pressure', 'fatigue'],
    pattern_anchors: ['working-or-cannot-stop', 'cannot-rest-without-guilt'],
  },
  {
    id: 'reels-while-exhausted',
    trigger: 'too tired to do anything, too awake to sleep',
    observable_action: 'lying down, phone above face, autoplaying',
    hidden_meaning: 'borrowed motion to substitute for rest',
    family_anchors: ['fatigue', 'collapse', 'overstimulation'],
    pattern_anchors: ['phone-from-anxiety', 'doomscroll-dissociation'],
  },
  {
    id: 'coffee-without-tasting',
    trigger: 'autopilot morning',
    observable_action: 'sip, sip, sip without registering temperature or flavour',
    hidden_meaning: 'ritual that survived without the experience that justified it',
    family_anchors: ['numbness', 'fatigue', 'paralysis'],
    pattern_anchors: ['cannot-rest-without-guilt', 'working-or-cannot-stop'],
  },
  {
    id: 'lying-in-bed-mentally-working',
    trigger: 'task list refusing to close',
    observable_action: 'eyes on the ceiling, hands still, breath shallow — but the head is at work',
    hidden_meaning: 'the body lay down, the work did not',
    family_anchors: ['pressure', 'fatigue', 'avoidance'],
    pattern_anchors: ['working-or-cannot-stop', 'sunday-anxiety'],
  },
  {
    id: 'fake-productivity-loop',
    trigger: 'guilt + low energy',
    observable_action: 'open file → check email → open file → check email → close laptop → open laptop',
    hidden_meaning: 'going through the motions while waiting for an idea or permission',
    family_anchors: ['pressure', 'fragmentation', 'paralysis'],
    pattern_anchors: ['cannot-rest-without-guilt', 'working-or-cannot-stop'],
  },
  {
    id: 'door-handle-pause',
    trigger: 'social cost just about to be paid',
    observable_action: 'hand on the door handle, three breaths, then opens it',
    hidden_meaning: 'rehearsing the version of themselves about to enter',
    family_anchors: ['avoidance', 'pressure'],
    pattern_anchors: ['overconnected-unreachable', 'sunday-anxiety'],
  },
  {
    id: 'phone-down-then-up-again',
    trigger: 'attempted self-control',
    observable_action: 'puts the phone face-down — picks it up again 90 seconds later',
    hidden_meaning: 'tried to be present, failed',
    family_anchors: ['avoidance', 'fragmentation', 'overstimulation'],
    pattern_anchors: ['phone-from-anxiety', 'overconnected-unreachable'],
  },
  {
    id: 'reply-rehearsal',
    trigger: 'message read, reply unsent',
    observable_action: 'types, deletes, types, deletes, locks the phone',
    hidden_meaning: 'no version of the reply matches what is actually felt',
    family_anchors: ['avoidance', 'pressure'],
    pattern_anchors: ['phone-from-anxiety', 'overconnected-unreachable'],
  },
  {
    id: 'tab-graveyard',
    trigger: 'unfinished thoughts piling up',
    observable_action: 'twenty-three tabs open across two windows; cmd-tab loop with no destination',
    hidden_meaning: 'each tab is a thought that was started and not closed',
    family_anchors: ['fragmentation', 'overstimulation'],
    pattern_anchors: ['working-or-cannot-stop', 'cannot-rest-without-guilt'],
  },
];

export interface RitualSelection {
  ritual: UnspokenRitual | null;
  confidence: number;        // 0..10
  briefLine: string;
  notes: string[];
}

export interface RitualInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  pattern: CulturalPattern | null;
  seed?: number;
}

export function selectUnspokenRitual(input: RitualInput): RitualSelection {
  const { state, pattern, seed = 0 } = input;
  const notes: string[] = [];

  const candidates = UNSPOKEN_RITUALS
    .map((r) => {
      let score = 0;
      if (r.family_anchors.includes(state.family)) score += 4;
      if (pattern && r.pattern_anchors.includes(pattern.id)) score += 5;
      return { ritual: r, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return {
      ritual: null,
      confidence: 0,
      briefLine: 'no specific unspoken ritual fits — the subject can simply be in the moment',
      notes: ['no ritual matched this state + pattern'],
    };
  }

  // Pick the top — with a seeded shuffle so the same state can rotate
  // rituals across the campaign.
  const top = candidates.slice(0, Math.min(3, candidates.length));
  const pick = top[Math.floor((seed + 1) % top.length)];

  const confidence = Math.min(10, pick.score * 1.2);

  notes.push(`ritual selected: "${pick.ritual.id}" — confidence ${confidence.toFixed(1)}/10`);

  const briefLine = `Unspoken modern ritual the camera catches MID-GESTURE (recognition is in the gesture, not the truth): ${pick.ritual.observable_action}. Beneath the gesture: ${pick.ritual.hidden_meaning}.`;

  return {
    ritual: pick.ritual,
    confidence,
    briefLine,
    notes,
  };
}
