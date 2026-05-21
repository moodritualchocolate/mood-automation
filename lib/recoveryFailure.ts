/**
 * RECOVERY FAILURE (Phase 17)
 *
 * Modern people are not only tired. They FAIL TO RECOVER.
 *
 * The spec named five recovery-failure modes:
 *
 *   resting while stimulated
 *   entertainment without restoration
 *   passive scrolling as fake recovery
 *   sleep without decompression
 *   weekends without reset
 *
 * The engine detects which failure mode the candidate banner is
 * capturing. Recovery failure is the spec's PREFERRED OUTCOME for
 * MOOD banners — when the system catches a scene of "rest that is
 * not rest", it scores it high. When the truth describes successful
 * recovery (which is rare in modern life), the score is low.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';

export type RecoveryFailureMode =
  | 'resting-while-stimulated'
  | 'entertainment-without-restoration'
  | 'passive-scrolling-as-fake-recovery'
  | 'sleep-without-decompression'
  | 'weekend-without-reset';

export interface RecoveryFailureRecord {
  id: RecoveryFailureMode;
  observable_pattern: string;
  why_it_fails: string;
}

export const RECOVERY_FAILURES: Record<RecoveryFailureMode, RecoveryFailureRecord> = {
  'resting-while-stimulated': {
    id: 'resting-while-stimulated',
    observable_pattern: 'body lying down or seated, eyes on phone or screen, hand still moving',
    why_it_fails: 'the body is in a rest posture; the nervous system is not — input keeps the system from downshifting',
  },
  'entertainment-without-restoration': {
    id: 'entertainment-without-restoration',
    observable_pattern: 'a show or game running for hours; subject expression flat',
    why_it_fails: 'consumption replaces decompression; the body is busy receiving input, not releasing the day',
  },
  'passive-scrolling-as-fake-recovery': {
    id: 'passive-scrolling-as-fake-recovery',
    observable_pattern: 'feed scroll labelled internally as "resting"; thumb keeps moving for an hour',
    why_it_fails: 'the body told itself this was rest; the nervous system was over-stimulated the entire time',
  },
  'sleep-without-decompression': {
    id: 'sleep-without-decompression',
    observable_pattern: 'phone in hand until lights-out; eyes closed but jaw still tight',
    why_it_fails: 'sleep starts where stimulation left off — no transition phase to release the day',
  },
  'weekend-without-reset': {
    id: 'weekend-without-reset',
    observable_pattern: 'Saturday morning: laptop checked, errands started, inbox audited',
    why_it_fails: 'two days off become a longer workweek with chores in the middle — the body never gets the reset signal',
  },
};

const STATE_TO_FAILURE: Record<string, RecoveryFailureMode[]> = {
  'doomscroll-fatigue':           ['passive-scrolling-as-fake-recovery'],
  'exhausted-scrolling':           ['passive-scrolling-as-fake-recovery', 'resting-while-stimulated'],
  'exhausted-but-wired':           ['sleep-without-decompression', 'resting-while-stimulated'],
  'low-battery-feeling':           ['entertainment-without-restoration'],
  'sunday-anxiety':                ['weekend-without-reset'],
  'late-afternoon-collapse':       ['entertainment-without-restoration'],
  'emotional-static':              ['entertainment-without-restoration'],
  'late-kitchen-silence':          ['entertainment-without-restoration'],
  'mentally-offline':              ['resting-while-stimulated'],
  'tired-but-continuing':          ['weekend-without-reset'],
  'forced-productivity':           ['weekend-without-reset'],
  'overstimulated-office':         ['resting-while-stimulated'],
};

const CORE_TO_FAILURE: Partial<Record<string, RecoveryFailureMode>> = {
  'too-tired-to-rest':              'sleep-without-decompression',
  'revenge-bedtime-procrastination':'sleep-without-decompression',
  'doomscrolling':                  'passive-scrolling-as-fake-recovery',
  'digital-fatigue':                'passive-scrolling-as-fake-recovery',
  'emotional-numbness':             'entertainment-without-restoration',
  'emotional-drift':                'entertainment-without-restoration',
  'silent-burnout':                 'weekend-without-reset',
};

const MOMENT_TO_FAILURE: Record<string, RecoveryFailureMode> = {
  'bed-scrolling':                  'sleep-without-decompression',
  'fridge-open-at-night':           'resting-while-stimulated',
  'saturday-stillness':             'weekend-without-reset',
  'late-kitchen-silence':           'entertainment-without-restoration',
  'eating-without-hunger':          'entertainment-without-restoration',
  'overstimulated-tabs':            'resting-while-stimulated',
};

export interface RecoveryFailureReading {
  primary_failure: RecoveryFailureRecord | null;
  /** 0..10 — higher = the banner clearly captures recovery failing. */
  recovery_failure_score: number;
  /** True when the banner shows rest that is NOT rest. */
  rest_is_not_rest: boolean;
  /** True when the truth describes successful recovery (rare; usually
   *  a sign the banner is being too clean). */
  describes_successful_recovery: boolean;
  notes: string[];
}

export interface RecoveryFailureInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  microMoment: CulturalMicroMoment | null;
}

export function readRecoveryFailure(input: RecoveryFailureInput): RecoveryFailureReading {
  const { state, truth, emotionalCore, microMoment } = input;
  const notes: string[] = [];

  let primary: RecoveryFailureRecord | null = null;
  let score = 0;

  const stateCandidates = STATE_TO_FAILURE[state.id] ?? [];
  if (stateCandidates.length > 0) {
    primary = RECOVERY_FAILURES[stateCandidates[0]];
    score = 7;
  }

  if (!primary && microMoment && MOMENT_TO_FAILURE[microMoment.state_id]) {
    primary = RECOVERY_FAILURES[MOMENT_TO_FAILURE[microMoment.state_id]];
    score = 6;
  }
  if (!primary && emotionalCore) {
    const id = CORE_TO_FAILURE[emotionalCore.id];
    if (id) {
      primary = RECOVERY_FAILURES[id];
      score = 5;
    }
  }

  // Truth-text — explicit mentions strengthen the score.
  const text = truth.truth.toLowerCase();
  if (/\b(rest|recover|recovery|recovered)\b/.test(text)) score = Math.max(score, 4);
  if (/\b(weekend|saturday|sunday|shabbat)\b/.test(text) && primary?.id !== 'weekend-without-reset') {
    if (!primary) primary = RECOVERY_FAILURES['weekend-without-reset'];
    score = Math.max(score, 6);
  }
  if (/\b(asleep|bed|bedtime|past midnight|01:\d{2}|02:\d{2}|03:\d{2})\b/.test(text)) {
    score = Math.max(score, 5);
  }

  // Did the truth describe successful recovery? (Modern life rarely
  // does; if it does, the banner reads as fake.)
  const SUCCESSFUL_RECOVERY = /\b(finally rested|truly relaxed|fully recovered|came back to (myself|themselves))\b/i;
  const describes_successful_recovery = SUCCESSFUL_RECOVERY.test(truth.truth);
  if (describes_successful_recovery) {
    score = Math.max(0, score - 4);
    notes.push('truth describes successful recovery — this is suspicious in modern life; likely fake');
  }

  const recovery_failure_score = Math.min(10, score);
  const rest_is_not_rest = recovery_failure_score >= 6 && !describes_successful_recovery;

  if (primary) notes.push(`primary recovery failure: ${primary.id} — ${primary.why_it_fails}`);
  if (!primary) notes.push('no recovery-failure pattern matched');
  if (rest_is_not_rest) notes.push('banner captures REST THAT IS NOT REST — modern life accurately observed');

  return {
    primary_failure: primary,
    recovery_failure_score,
    rest_is_not_rest,
    describes_successful_recovery,
    notes,
  };
}
