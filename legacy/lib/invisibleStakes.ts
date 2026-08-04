/**
 * INVISIBLE STAKES (Phase 13)
 *
 * Detects the modern compulsions and low-grade anxiety rituals that
 * count as INVISIBLE SELF-PUNISHMENT — costs that look like normal
 * behavior but are actually the day quietly billing the body.
 *
 * The spec named:
 *   hidden emotional cost
 *   invisible self-punishment
 *   modern compulsions
 *   low-grade anxiety rituals
 *   avoidance disguised as productivity
 *
 * Example: "checking notifications before opening eyes" is NOT
 * phone-use — it is the day starting in a deficit before the body
 * has agreed to begin. That is the invisible stake.
 */

import type { CulturalPattern } from './sharedCulturalMemory';
import type { EmotionalCore } from './humanTruthEngine';
import type { UnspokenRitual } from './unspokenRituals';
import type { HumanState } from '@/core/types';

export type ModernCompulsion =
  | 'check-notifications-before-eyes-open'
  | 'reopen-laptop-after-shutdown'
  | 'refresh-feed-for-no-reason'
  | 'rehearse-reply-then-not-send'
  | 'lock-screen-pull-down'
  | 'tab-pile-instead-of-decide'
  | 'productivity-loop-as-avoidance'
  | 'inbox-zero-as-mood-regulation'
  | 'instagram-check-mid-conversation'
  | 'phone-down-then-up-again-90s'
  | 'work-late-because-stopping-feels-worse'
  | 'sunday-calendar-rehearsal';

export interface CompulsionRecord {
  id: ModernCompulsion;
  observable_behavior: string;
  what_it_actually_is: string;          // the invisible stake
  daily_cost: string;                   // what is being paid
}

export const MODERN_COMPULSIONS: Record<ModernCompulsion, CompulsionRecord> = {
  'check-notifications-before-eyes-open': {
    id: 'check-notifications-before-eyes-open',
    observable_behavior: 'phone in hand before the eyes open in the morning',
    what_it_actually_is: 'the day starting in a deficit before the body has agreed to begin',
    daily_cost: 'the first minute of awareness belongs to obligations, not to the subject',
  },
  'reopen-laptop-after-shutdown': {
    id: 'reopen-laptop-after-shutdown',
    observable_behavior: 'closed the laptop on the couch, reopened it within four minutes',
    what_it_actually_is: 'the day refused to be done — guilt rebooting work without permission',
    daily_cost: 'the evening becomes a continuation of the office',
  },
  'refresh-feed-for-no-reason': {
    id: 'refresh-feed-for-no-reason',
    observable_behavior: 'pulling the feed down at intervals when nothing has changed',
    what_it_actually_is: 'asking the device to deliver a feeling the body cannot generate',
    daily_cost: 'attention spent on nothing in particular for thirty minutes a day',
  },
  'rehearse-reply-then-not-send': {
    id: 'rehearse-reply-then-not-send',
    observable_behavior: 'typed, deleted, typed, deleted, locked the phone',
    what_it_actually_is: 'paying social tax for a conversation that never happened',
    daily_cost: 'the obligation stays open; the relief never lands',
  },
  'lock-screen-pull-down': {
    id: 'lock-screen-pull-down',
    observable_behavior: 'thumb swipes down to re-pull notifications that have not arrived',
    what_it_actually_is: 'asking the device to be the one to start the day',
    daily_cost: 'small dose of disappointment every ninety seconds',
  },
  'tab-pile-instead-of-decide': {
    id: 'tab-pile-instead-of-decide',
    observable_behavior: 'twenty-three tabs open; cmd-tab with no destination',
    what_it_actually_is: 'avoiding the decision by keeping every option open',
    daily_cost: 'attention divided into pieces too small to use',
  },
  'productivity-loop-as-avoidance': {
    id: 'productivity-loop-as-avoidance',
    observable_behavior: 'open file → check email → open file → check email → close laptop → open laptop',
    what_it_actually_is: 'going through the motions while waiting for permission to stop',
    daily_cost: 'hours of effort with the texture of work, the result of zero',
  },
  'inbox-zero-as-mood-regulation': {
    id: 'inbox-zero-as-mood-regulation',
    observable_behavior: 'archiving emails compulsively until none remain',
    what_it_actually_is: 'using a control surface to manage a feeling',
    daily_cost: 'the inbox stays clean; the feeling refills tomorrow',
  },
  'instagram-check-mid-conversation': {
    id: 'instagram-check-mid-conversation',
    observable_behavior: 'phone glance during a friend\'s sentence',
    what_it_actually_is: 'a small exit from being present',
    daily_cost: 'the friend feels it; nothing is said',
  },
  'phone-down-then-up-again-90s': {
    id: 'phone-down-then-up-again-90s',
    observable_behavior: 'puts the phone face-down; picks it up again 90 seconds later',
    what_it_actually_is: 'tried to be present, failed, recommitted to failing',
    daily_cost: 'attention bandwidth that never gets to consolidate',
  },
  'work-late-because-stopping-feels-worse': {
    id: 'work-late-because-stopping-feels-worse',
    observable_behavior: 'still at the laptop past 23:30 with no real progress',
    what_it_actually_is: 'avoidance disguised as productivity — stopping has become its own punishment',
    daily_cost: 'the next day starts already drained',
  },
  'sunday-calendar-rehearsal': {
    id: 'sunday-calendar-rehearsal',
    observable_behavior: 'opens the week\'s calendar on a Sunday evening',
    what_it_actually_is: 'the weekend ended hours ago, by the time the body noticed',
    daily_cost: 'two days of rest collapse into one effective evening',
  },
};

const STATE_TO_COMPULSIONS: Record<string, ModernCompulsion[]> = {
  'doomscroll-fatigue':           ['refresh-feed-for-no-reason', 'lock-screen-pull-down'],
  'exhausted-scrolling':           ['refresh-feed-for-no-reason', 'phone-down-then-up-again-90s'],
  'no-motivation-morning':         ['check-notifications-before-eyes-open'],
  'slow-brain-morning':            ['check-notifications-before-eyes-open'],
  'unread-messages-anxiety':       ['rehearse-reply-then-not-send'],
  'sunday-anxiety':                ['sunday-calendar-rehearsal'],
  'tab-switching-paralysis':       ['tab-pile-instead-of-decide'],
  'too-many-tabs':                 ['tab-pile-instead-of-decide'],
  'fake-productivity':             ['productivity-loop-as-avoidance'],
  'forced-productivity':           ['work-late-because-stopping-feels-worse', 'productivity-loop-as-avoidance'],
  'startup-burnout':               ['work-late-because-stopping-feels-worse', 'reopen-laptop-after-shutdown'],
  'overwhelmed-founder':           ['reopen-laptop-after-shutdown'],
  'constant-notifications':        ['lock-screen-pull-down'],
  'mentally-absent':               ['instagram-check-mid-conversation'],
  'social-exhaustion':             ['instagram-check-mid-conversation'],
};

export interface StakesReading {
  compulsion: CompulsionRecord | null;
  /** The invisible stake — what is actually being paid. */
  invisible_cost: string | null;
  /** 0..10 — how strongly the candidate banner could express this. */
  self_punishment_score: number;
  /** True when the banner has a clear modern compulsion identified. */
  has_modern_compulsion: boolean;
  notes: string[];
}

export interface StakesInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  pattern: CulturalPattern | null;
  ritual: UnspokenRitual | null;
}

export function readInvisibleStakes(input: StakesInput): StakesReading {
  const { state, emotionalCore, pattern, ritual } = input;
  const notes: string[] = [];

  // Direct state mapping — strongest signal.
  let compulsion: CompulsionRecord | null = null;
  const candidates = STATE_TO_COMPULSIONS[state.id] ?? [];
  if (candidates.length > 0) compulsion = MODERN_COMPULSIONS[candidates[0]];

  // Map from ritual if available.
  if (!compulsion && ritual) {
    const ritualMap: Record<string, ModernCompulsion> = {
      'app-switching-without-intention': 'lock-screen-pull-down',
      'rechecking-notifications':         'lock-screen-pull-down',
      'laptop-reopen-after-shutdown':     'reopen-laptop-after-shutdown',
      'reels-while-exhausted':            'refresh-feed-for-no-reason',
      'fake-productivity-loop':           'productivity-loop-as-avoidance',
      'phone-down-then-up-again':         'phone-down-then-up-again-90s',
      'reply-rehearsal':                  'rehearse-reply-then-not-send',
      'tab-graveyard':                    'tab-pile-instead-of-decide',
    };
    const id = ritualMap[ritual.id];
    if (id) compulsion = MODERN_COMPULSIONS[id];
  }

  // Fallback: emotional-core to compulsion.
  if (!compulsion && emotionalCore) {
    const coreMap: Partial<Record<string, ModernCompulsion>> = {
      'doomscrolling':                'refresh-feed-for-no-reason',
      'digital-fatigue':              'lock-screen-pull-down',
      'too-tired-to-rest':            'reopen-laptop-after-shutdown',
      'silent-burnout':               'work-late-because-stopping-feels-worse',
      'avoidance':                    'productivity-loop-as-avoidance',
      'guilt':                        'rehearse-reply-then-not-send',
      'overstimulated-but-flat':      'tab-pile-instead-of-decide',
      'emotional-fragmentation':      'tab-pile-instead-of-decide',
    };
    const id = coreMap[emotionalCore.id];
    if (id) compulsion = MODERN_COMPULSIONS[id];
  }

  // Pattern as additional anchor.
  if (!compulsion && pattern) {
    if (pattern.id === 'phone-from-anxiety')  compulsion = MODERN_COMPULSIONS['lock-screen-pull-down'];
    if (pattern.id === 'working-or-cannot-stop') compulsion = MODERN_COMPULSIONS['work-late-because-stopping-feels-worse'];
    if (pattern.id === 'sunday-anxiety')      compulsion = MODERN_COMPULSIONS['sunday-calendar-rehearsal'];
  }

  const invisible_cost = compulsion?.what_it_actually_is ?? null;

  let self_punishment_score = compulsion ? 6 : 0;
  if (compulsion && pattern) self_punishment_score += 2;
  if (compulsion && ritual) self_punishment_score += 1.5;
  self_punishment_score = Math.max(0, Math.min(10, self_punishment_score));

  const has_modern_compulsion = compulsion !== null;
  if (has_modern_compulsion) {
    notes.push(`compulsion identified: ${compulsion!.id}`);
    notes.push(`invisible cost: ${compulsion!.daily_cost}`);
  } else {
    notes.push('no modern compulsion mapped for this state');
  }

  return {
    compulsion,
    invisible_cost,
    self_punishment_score,
    has_modern_compulsion,
    notes,
  };
}
