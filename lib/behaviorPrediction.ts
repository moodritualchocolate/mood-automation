/**
 * BEHAVIOR PREDICTION (Phase 24)
 *
 * Predicts the NEXT BEHAVIOR the subject is likely to perform — not
 * the next feeling (that is emotionalForecasting), but the next
 * concrete act: the next loop, the next escape, the next ritual.
 *
 * Used to give the campaign a sense of the subject's near-future
 * behavioral path, so a banner can be positioned just BEFORE a
 * recognisable next move.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type PredictedBehaviorId =
  | 'will-reach-for-the-phone'
  | 'will-reopen-the-laptop'
  | 'will-pour-another-coffee'
  | 'will-defer-the-rest-again'
  | 'will-take-the-micro-escape'
  | 'will-say-im-fine'
  | 'will-stay-up-past-the-plan'
  | 'will-not-reply-to-the-message';

export interface PredictedBehaviorRecord {
  id: PredictedBehaviorId;
  the_act: string;
  the_window: string;               // when it tends to happen
}

export const PREDICTED_BEHAVIORS: Record<PredictedBehaviorId, PredictedBehaviorRecord> = {
  'will-reach-for-the-phone':   { id: 'will-reach-for-the-phone',   the_act: 'reach for the phone in the next pause',                 the_window: 'within the next 3 minutes' },
  'will-reopen-the-laptop':     { id: 'will-reopen-the-laptop',     the_act: 'reopen the laptop after closing it',                   the_window: 'within the next 20 minutes' },
  'will-pour-another-coffee':   { id: 'will-pour-another-coffee',   the_act: 'pour another coffee that will not work',               the_window: 'this afternoon' },
  'will-defer-the-rest-again':  { id: 'will-defer-the-rest-again',  the_act: 'move the planned rest to a later, vaguer slot',         the_window: 'when the rest window arrives' },
  'will-take-the-micro-escape': { id: 'will-take-the-micro-escape', the_act: 'take a micro-escape — bathroom, car, errand',           the_window: 'when the social load next peaks' },
  'will-say-im-fine':           { id: 'will-say-im-fine',           the_act: 'answer "i\'m fine" to the next "how are you"',          the_window: 'the next time it is asked' },
  'will-stay-up-past-the-plan': { id: 'will-stay-up-past-the-plan', the_act: 'stay up past the intended bedtime',                    the_window: 'tonight' },
  'will-not-reply-to-the-message':{ id: 'will-not-reply-to-the-message',the_act: 'leave the message unanswered another day',          the_window: 'over the next few days' },
};

const STATE_TO_PREDICTED: Record<string, PredictedBehaviorId[]> = {
  'doomscroll-fatigue':              ['will-reach-for-the-phone'],
  'silent-burnout':                  ['will-defer-the-rest-again', 'will-say-im-fine'],
  'startup-burnout':                 ['will-reopen-the-laptop', 'will-stay-up-past-the-plan'],
  'overwhelmed-founder':             ['will-reopen-the-laptop'],
  'late-afternoon-collapse':         ['will-pour-another-coffee'],
  'exhausted-but-wired':             ['will-stay-up-past-the-plan'],
  'overconnected-exhaustion':        ['will-not-reply-to-the-message'],
  'unread-messages-anxiety':         ['will-not-reply-to-the-message'],
  'social-load-exhaustion':          ['will-take-the-micro-escape'],
  'mentally-absent':                 ['will-say-im-fine'],
  'sunday-anxiety':                  ['will-defer-the-rest-again'],
  'overstimulated-office':           ['will-take-the-micro-escape'],
};

const CORE_TO_PREDICTED: Partial<Record<string, PredictedBehaviorId>> = {
  'doomscrolling':                  'will-reach-for-the-phone',
  'too-tired-to-rest':              'will-stay-up-past-the-plan',
  'silent-burnout':                 'will-defer-the-rest-again',
  'social-mask-fatigue':            'will-say-im-fine',
};

export interface BehaviorPredictionReading {
  primary: PredictedBehaviorRecord | null;
  secondary: PredictedBehaviorRecord | null;
  /** 0..10 — confidence the predicted behavior will occur. */
  prediction_confidence: number;
  notes: string[];
}

export interface BehaviorPredictionInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readBehaviorPrediction(input: BehaviorPredictionInput): BehaviorPredictionReading {
  const { state, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: PredictedBehaviorId[] = [];
  for (const id of STATE_TO_PREDICTED[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_PREDICTED[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? PREDICTED_BEHAVIORS[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? PREDICTED_BEHAVIORS[candidates[1]] : null;
  const prediction_confidence = primary ? (secondary ? 8 : 6) : 0;
  if (primary) notes.push(`predicted next behavior: ${primary.id} — "${primary.the_act}" (${primary.the_window})`);
  return { primary, secondary, prediction_confidence, notes };
}
