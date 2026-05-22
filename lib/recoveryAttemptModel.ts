/**
 * RECOVERY ATTEMPT MODEL (Phase 24)
 *
 * Models the subject's NEXT attempt at recovery — and, crucially,
 * predicts whether it will work. Modern recovery attempts mostly
 * partially-fail: they produce a small unstable relief that does not
 * hold. The engine refuses banners that depict recovery as
 * inspirational or clean.
 *
 * Different from Phase 17 recoveryFailure (the failure mode of a
 * rest already taken) and Phase 18 fakeRecovery (the cultural
 * performance). Phase 24 recoveryAttemptModel is PREDICTIVE — it
 * forecasts the next attempt and its likely outcome.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type RecoveryAttemptId =
  | 'an-early-night'
  | 'a-weekend-with-no-plans'
  | 'a-walk-without-the-phone'
  | 'one-cancelled-commitment'
  | 'a-real-conversation'
  | 'a-day-off-mid-week'
  | 'saying-no-to-one-thing';

export type RecoveryOutcome = 'partial-unstable-relief' | 'brief-relief-then-rebound' | 'no-real-change' | 'small-real-gain';

export interface RecoveryAttemptRecord {
  id: RecoveryAttemptId;
  the_attempt: string;
  most_likely_outcome: RecoveryOutcome;
  why: string;
}

export const RECOVERY_ATTEMPTS: Record<RecoveryAttemptId, RecoveryAttemptRecord> = {
  'an-early-night':            { id: 'an-early-night',            the_attempt: 'an early night',                       most_likely_outcome: 'brief-relief-then-rebound', why: 'one night does not repay a long deficit; the next day reabsorbs it' },
  'a-weekend-with-no-plans':   { id: 'a-weekend-with-no-plans',   the_attempt: 'a weekend deliberately left empty',    most_likely_outcome: 'partial-unstable-relief',   why: 'the empty time fills with low-grade admin and guilt' },
  'a-walk-without-the-phone':  { id: 'a-walk-without-the-phone',  the_attempt: 'a walk with the phone left at home',   most_likely_outcome: 'small-real-gain',           why: 'short, specific, low-cost — one of the few attempts that tends to land' },
  'one-cancelled-commitment':  { id: 'one-cancelled-commitment',  the_attempt: 'cancelling one thing on the calendar', most_likely_outcome: 'partial-unstable-relief',   why: 'the relief is real but undercut by the guilt of cancelling' },
  'a-real-conversation':       { id: 'a-real-conversation',       the_attempt: 'one honest conversation with someone', most_likely_outcome: 'small-real-gain',           why: 'being known reduces the load — when the conversation actually happens' },
  'a-day-off-mid-week':        { id: 'a-day-off-mid-week',        the_attempt: 'a single day off in the middle of the week',most_likely_outcome: 'brief-relief-then-rebound',why: 'the work waits and doubles; the day off is partly pre-spent on dread' },
  'saying-no-to-one-thing':    { id: 'saying-no-to-one-thing',    the_attempt: 'declining one request',                most_likely_outcome: 'no-real-change',            why: 'one no does not shift the structural over-commitment' },
};

const STATE_TO_ATTEMPT: Record<string, RecoveryAttemptId[]> = {
  'silent-burnout':                  ['a-day-off-mid-week', 'saying-no-to-one-thing'],
  'exhausted-but-wired':             ['an-early-night'],
  'restless-night':                  ['an-early-night'],
  'sunday-anxiety':                  ['a-weekend-with-no-plans'],
  'overconnected-exhaustion':        ['a-walk-without-the-phone'],
  'doomscroll-fatigue':              ['a-walk-without-the-phone'],
  'overwhelmed-founder':             ['one-cancelled-commitment', 'a-day-off-mid-week'],
  'emotionally-drained':             ['a-real-conversation'],
  'social-load-exhaustion':          ['saying-no-to-one-thing'],
  'always-on-anxiety':               ['one-cancelled-commitment'],
};

const CORE_TO_ATTEMPT: Partial<Record<string, RecoveryAttemptId>> = {
  'too-tired-to-rest':              'an-early-night',
  'silent-burnout':                 'a-day-off-mid-week',
  'overstimulation':                'a-walk-without-the-phone',
};

const INSPIRATIONAL_RECOVERY = /\b(transformed|healed|found myself|everything shifted|new chapter|reborn|finally free|breakthrough)\b/i;

export interface RecoveryAttemptReading {
  primary: RecoveryAttemptRecord | null;
  /** 0..10 — how realistic the predicted recovery reads. */
  recovery_realism: number;
  /** True when the truth frames recovery as inspirational / clean. */
  recovery_too_inspirational: boolean;
  notes: string[];
}

export interface RecoveryAttemptInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readRecoveryAttemptModel(input: RecoveryAttemptInput): RecoveryAttemptReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: RecoveryAttemptId[] = [];
  for (const id of STATE_TO_ATTEMPT[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_ATTEMPT[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? RECOVERY_ATTEMPTS[candidates[0]] : null;
  const recovery_too_inspirational = INSPIRATIONAL_RECOVERY.test(truth.truth);

  let recovery_realism = primary ? 7 : 0;
  if (recovery_too_inspirational) recovery_realism -= 5;
  recovery_realism = Math.max(0, Math.min(10, recovery_realism));

  if (primary) notes.push(`predicted recovery attempt: ${primary.id} → likely "${primary.most_likely_outcome}" (${primary.why})`);
  if (recovery_too_inspirational) notes.push('WARNING: recovery framed as inspirational — Phase 24 forbids clean recovery');
  return { primary, recovery_realism, recovery_too_inspirational, notes };
}
