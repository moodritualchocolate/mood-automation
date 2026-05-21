/**
 * FAKE RECOVERY (Phase 18)
 *
 * The behaviors that LOOK like recovery — that the subject and the
 * surrounding culture CLAIM are recovery — but that the body does not
 * recognise as restorative.
 *
 * Carefully different from Phase 17's recoveryFailure:
 *
 *   Phase 17 RECOVERY FAILURE asks: "the body tried to rest. Did the
 *   nervous system actually downshift?" — it scores the failure of
 *   REST as a physiological process.
 *
 *   Phase 18 FAKE RECOVERY asks: "the subject is performing a
 *   recovery RITUAL. Does the ritual still recover, or has it become
 *   a CULTURAL PERFORMANCE of recovery?" — it scores the SOCIAL
 *   PERFORMANCE of self-care behaviors that no longer restore.
 *
 * The spec named:
 *   spa-day-as-content
 *   weekend-trip-that-was-work-with-views
 *   workout-as-anxiety-burnoff
 *   meditation-app-as-checklist-item
 *   journaling-that-curates-instead-of-reveals
 *   nature-walk-while-on-a-call
 *   "rest day" spent answering Slack from bed
 *   reading-self-help-instead-of-resting
 *
 * Each fake recovery scores:
 *   performance_to_recovery_ratio  — how much is performance vs. restoration
 *   cultural_endorsement           — how much the culture insists this counts as rest
 *   subject_self_deception         — how much the subject would defend it
 *   actual_restoration             — how much the body actually recovered (low = fake)
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type FakeRecoveryId =
  | 'spa-day-as-content'
  | 'weekend-trip-that-was-work-with-views'
  | 'workout-as-anxiety-burnoff'
  | 'meditation-app-checklist'
  | 'journaling-as-curation'
  | 'nature-walk-on-a-call'
  | 'rest-day-on-slack-from-bed'
  | 'self-help-instead-of-resting'
  | 'sunday-reset-as-second-workday'
  | 'sleep-tracker-anxiety';

export interface FakeRecoveryRecord {
  id: FakeRecoveryId;
  observable_action: string;
  claimed_purpose: string;
  what_it_actually_is: string;
  why_it_fails_to_restore: string;
  cultural_alibi: string;
}

export const FAKE_RECOVERIES: Record<FakeRecoveryId, FakeRecoveryRecord> = {
  'spa-day-as-content': {
    id: 'spa-day-as-content',
    observable_action: 'phone in robe pocket, photos of the towel, posts the steam shot, leaves restless',
    claimed_purpose: 'rest, reset, deep self-care',
    what_it_actually_is: 'a content-production day in a wellness costume',
    why_it_fails_to_restore: 'the body was performing the photo and reading reactions the whole time',
    cultural_alibi: 'treat yourself, you earned it',
  },
  'weekend-trip-that-was-work-with-views': {
    id: 'weekend-trip-that-was-work-with-views',
    observable_action: 'laptop in the airbnb, slack in the evenings, called it a getaway, came back tired',
    claimed_purpose: 'a real break',
    what_it_actually_is: 'the workweek relocated 200km with a window',
    why_it_fails_to_restore: 'the work continued; the body got no off-ramp',
    cultural_alibi: 'workation',
  },
  'workout-as-anxiety-burnoff': {
    id: 'workout-as-anxiety-burnoff',
    observable_action: 'an extra-hard session after a hard day; metrics matter more than form; the cortisol was already at ceiling',
    claimed_purpose: 'stress release, endorphins, health',
    what_it_actually_is: 'metabolising anxiety with cardio so the body stops asking',
    why_it_fails_to_restore: 'the nervous system was already in fight; the workout extended fight',
    cultural_alibi: 'I needed to move my body',
  },
  'meditation-app-checklist': {
    id: 'meditation-app-checklist',
    observable_action: 'opens the meditation app at 21:55, ten-minute session, closes it, checks the streak',
    claimed_purpose: 'presence, calm, mindfulness',
    what_it_actually_is: 'a productivity ritual styled as stillness',
    why_it_fails_to_restore: 'the experience was measured, scored, and added to a streak — the opposite of resting',
    cultural_alibi: 'I do my meditation every day',
  },
  'journaling-as-curation': {
    id: 'journaling-as-curation',
    observable_action: 'writes in the notebook; chooses words carefully; rephrases for the future-self who will read it',
    claimed_purpose: 'processing, self-knowledge, getting things out',
    what_it_actually_is: 'composing the self for a future audience of one',
    why_it_fails_to_restore: 'curation prevents the chaotic processing the practice is for',
    cultural_alibi: 'I do my morning pages',
  },
  'nature-walk-on-a-call': {
    id: 'nature-walk-on-a-call',
    observable_action: 'walks the trail on a phone call; airpods in; sees nothing; calls it "getting outside"',
    claimed_purpose: 'fresh air, decompression',
    what_it_actually_is: 'a phone meeting with trees in the background',
    why_it_fails_to_restore: 'the conversation kept the cognitive load identical to the office',
    cultural_alibi: 'I love walking meetings',
  },
  'rest-day-on-slack-from-bed': {
    id: 'rest-day-on-slack-from-bed',
    observable_action: 'PTO scheduled; laptop in bed; "quick checks" all day; came back to work more tired',
    claimed_purpose: 'a day off',
    what_it_actually_is: 'a workday with worse posture',
    why_it_fails_to_restore: 'no off-ramp signalled — the body never registered the day as different',
    cultural_alibi: 'I just kept an eye on a few things',
  },
  'self-help-instead-of-resting': {
    id: 'self-help-instead-of-resting',
    observable_action: 'on the couch with a book about better habits / better sleep / better mornings, two hours, no rest',
    claimed_purpose: 'getting better',
    what_it_actually_is: 'shopping for solutions in book form, ranked as productivity',
    why_it_fails_to_restore: 'the activity is cognitively identical to work',
    cultural_alibi: 'I am working on myself',
  },
  'sunday-reset-as-second-workday': {
    id: 'sunday-reset-as-second-workday',
    observable_action: 'Sunday: meal-prep, laundry, calendar review, inbox audit, errands, social posts about the reset',
    claimed_purpose: 'a calm reset day',
    what_it_actually_is: 'a workday with chores',
    why_it_fails_to_restore: 'the week never gets the off-ramp; Monday begins from the same heart rate',
    cultural_alibi: 'sunday reset',
  },
  'sleep-tracker-anxiety': {
    id: 'sleep-tracker-anxiety',
    observable_action: 'wakes up; checks the wearable; the score is 71; the rest of the morning is shaped by the number',
    claimed_purpose: 'optimising sleep',
    what_it_actually_is: 'a fresh source of low-grade anxiety added to the morning',
    why_it_fails_to_restore: 'the body now performs sleep for a metric',
    cultural_alibi: 'my recovery score was bad',
  },
};

const STATE_TO_FAKE: Record<string, FakeRecoveryId[]> = {
  'sunday-anxiety':                  ['sunday-reset-as-second-workday'],
  'weekend-without-reset':           ['weekend-trip-that-was-work-with-views', 'sunday-reset-as-second-workday'],
  'forced-productivity':             ['rest-day-on-slack-from-bed', 'self-help-instead-of-resting'],
  'overconnected-exhaustion':        ['nature-walk-on-a-call', 'rest-day-on-slack-from-bed'],
  'social-load-exhaustion':          ['spa-day-as-content'],
  'optimization-burnout':            ['meditation-app-checklist', 'sleep-tracker-anxiety'],
  'wellness-burnout':                ['meditation-app-checklist', 'journaling-as-curation', 'sleep-tracker-anxiety'],
  'exhausted-but-wired':             ['workout-as-anxiety-burnoff'],
  'overwhelmed-founder':             ['workout-as-anxiety-burnoff', 'weekend-trip-that-was-work-with-views'],
  'startup-burnout':                 ['weekend-trip-that-was-work-with-views', 'rest-day-on-slack-from-bed'],
  'always-on-anxiety':               ['nature-walk-on-a-call'],
  'self-improvement-fatigue':        ['self-help-instead-of-resting', 'journaling-as-curation'],
};

const CORE_TO_FAKE: Partial<Record<string, FakeRecoveryId>> = {
  'silent-burnout':                 'rest-day-on-slack-from-bed',
  'too-tired-to-rest':              'workout-as-anxiety-burnoff',
  'optimization-pressure':          'meditation-app-checklist',
  'wellness-pressure':              'meditation-app-checklist',
  'invisible-pressure':             'sunday-reset-as-second-workday',
  'performance-pressure':           'spa-day-as-content',
  'always-improving':               'self-help-instead-of-resting',
};

export interface FakeRecoveryReading {
  primary: FakeRecoveryRecord | null;
  /** 0..10 — overall fake-recovery signal strength. */
  fake_recovery_score: number;
  /** 0..10 — how much of the behaviour is performance vs. restoration. */
  performance_to_recovery_ratio: number;
  /** 0..10 — how strongly the culture insists this counts as rest. */
  cultural_endorsement: number;
  /** 0..10 — how strongly the subject would defend the activity. */
  subject_self_deception: number;
  /** 0..10 — how much the body actually recovered (low = fake). */
  actual_restoration: number;
  /** True when the truth uses the cultural-alibi language (e.g.
   *  "sunday reset", "workation"). */
  uses_alibi_language: boolean;
  /** True when the banner reads as PERFORMING rest, not resting. */
  performs_rest: boolean;
  notes: string[];
}

export interface FakeRecoveryInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const ALIBI_PHRASES = /\b(workation|sunday reset|reset day|treat yourself|me[- ]?time|self[- ]?care sunday|morning pages|recovery score|workout endorphins|walking meeting|rest day)\b/i;
const PERFORMANCE_VERBS = /\b(post(s|ed)?|story|stories|share(s|d)?|stream(s|ed)?|stream(s|ed)?|caption(s|ed)?|hashtag|aesthetic|curate(s|d)?)\b/i;
const RESTORATION_LANGUAGE = /\b(actually rested|finally exhaled|did nothing|stopped|let go|no phone|no laptop|nobody saw)\b/i;

export function readFakeRecovery(input: FakeRecoveryInput): FakeRecoveryReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: FakeRecoveryId[] = [];
  for (const id of STATE_TO_FAKE[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_FAKE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? FAKE_RECOVERIES[candidates[0]] : null;

  const text = truth.truth.toLowerCase();
  const uses_alibi_language = ALIBI_PHRASES.test(text);
  const usesPerformance = PERFORMANCE_VERBS.test(text);
  const usesRestoration = RESTORATION_LANGUAGE.test(text);

  // Performance:recovery ratio.
  let performance_to_recovery_ratio = 0;
  if (primary) performance_to_recovery_ratio = 6;
  if (usesPerformance) performance_to_recovery_ratio += 2;
  if (uses_alibi_language) performance_to_recovery_ratio += 2;
  if (usesRestoration) performance_to_recovery_ratio -= 4;
  performance_to_recovery_ratio = clamp10(performance_to_recovery_ratio);

  // Cultural endorsement varies by ritual.
  let cultural_endorsement = 0;
  if (primary) {
    const HIGH = new Set<FakeRecoveryId>(['meditation-app-checklist', 'sunday-reset-as-second-workday', 'workout-as-anxiety-burnoff', 'sleep-tracker-anxiety']);
    const MID  = new Set<FakeRecoveryId>(['spa-day-as-content', 'weekend-trip-that-was-work-with-views', 'self-help-instead-of-resting']);
    cultural_endorsement = HIGH.has(primary.id) ? 9 : MID.has(primary.id) ? 7 : 5;
  }

  // Subject self-deception — how hard would the subject defend it?
  const subject_self_deception = primary ? clamp10(5 + (uses_alibi_language ? 3 : 0) + (cultural_endorsement >= 8 ? 2 : 0)) : 0;

  // Actual restoration = inverse of performance:recovery.
  const actual_restoration = primary ? clamp10(10 - performance_to_recovery_ratio + (usesRestoration ? 2 : 0)) : 5;

  // Composite fake_recovery_score.
  let score = 0;
  if (primary) score += 4;
  score += (performance_to_recovery_ratio / 10) * 3;
  score += (cultural_endorsement / 10) * 1.5;
  if (uses_alibi_language) score += 1.5;
  if (usesRestoration) score -= 3;
  const fake_recovery_score = clamp10(score);

  const performs_rest = fake_recovery_score >= 6 && !usesRestoration;

  if (primary) {
    notes.push(`fake recovery: ${primary.id} — claimed "${primary.claimed_purpose}", actually "${primary.what_it_actually_is}"`);
    notes.push(`alibi: "${primary.cultural_alibi}" — banner must NOT use this language`);
  } else {
    notes.push('no fake-recovery pattern matched');
  }
  if (uses_alibi_language) notes.push('WARNING: truth uses cultural-alibi language (e.g. "sunday reset") — banner performs rest instead of observing it');
  if (performs_rest) notes.push('banner reads as PERFORMING rest, not actually resting — refuse at brutal');

  return {
    primary,
    fake_recovery_score,
    performance_to_recovery_ratio,
    cultural_endorsement,
    subject_self_deception,
    actual_restoration,
    uses_alibi_language,
    performs_rest,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
