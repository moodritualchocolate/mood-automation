/**
 * SILENT COPING MECHANISMS (Phase 18)
 *
 * Below the level of language. Modern people have invented dozens of
 * tiny, unnamed coping moves that nobody describes out loud, that
 * therapy has no vocabulary for yet, and that the subject would not
 * even register as "coping" if asked.
 *
 * The spec named:
 *   emotional buffering        — micro-pauses inserted before reacting
 *   private decompression      — solo regulation moves nobody sees
 *   covert reset rituals       — short physical re-centring acts
 *   internal monologue muting  — turning off the inner voice mid-day
 *   silent withdrawal          — going quiet without leaving the room
 *   emotional time-stretching  — slowing seconds to absorb impact
 *
 * Different from Phase 18 microEscapeDetection (PHYSICAL withdrawal —
 * leaving the room) and Phase 18 ritualCompensation (NAMED, repeated
 * behavior). Silent coping is INTERNAL, UNNAMED, and OFTEN INVISIBLE
 * even to the subject.
 *
 * The cinematic value of silent coping is enormous — it is what a
 * great photograph captures that the subject never noticed they did.
 *
 * Each silent coping move is scored:
 *   below_the_named           — how unnamed the move is in normal vocabulary
 *   visible_to_third_party    — would a perceptive bystander see it?
 *   visible_to_subject        — would the subject themselves describe it?
 *   captures_real_humanity    — does the candidate banner make it visible?
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type SilentCopingId =
  | 'emotional-buffering'
  | 'private-decompression'
  | 'covert-reset-ritual'
  | 'internal-monologue-muting'
  | 'silent-withdrawal'
  | 'emotional-time-stretching'
  | 'breath-held-then-released'
  | 'jaw-unclench'
  | 'two-second-eye-close'
  | 'face-wash-as-reset';

export interface SilentCopingRecord {
  id: SilentCopingId;
  observable_micro_action: string;
  internal_purpose: string;
  duration_seconds: [number, number];
  third_party_visibility: 'invisible' | 'rare-catch' | 'often-noticed';
  subject_awareness: 'unconscious' | 'half-aware' | 'aware-but-unnamed';
  cinematic_marker: string;          // the photograph note that captures it
}

export const SILENT_COPING: Record<SilentCopingId, SilentCopingRecord> = {
  'emotional-buffering': {
    id: 'emotional-buffering',
    observable_micro_action: 'a half-beat pause between hearing something hard and responding to it',
    internal_purpose: 'absorb the hit before the face has to perform',
    duration_seconds: [1, 4],
    third_party_visibility: 'rare-catch',
    subject_awareness: 'unconscious',
    cinematic_marker: 'expression frozen one beat longer than the sentence required',
  },
  'private-decompression': {
    id: 'private-decompression',
    observable_micro_action: 'shoulders drop, jaw releases, breath out — the moment alone after a door closes',
    internal_purpose: 'release the body posture the day required',
    duration_seconds: [3, 30],
    third_party_visibility: 'invisible',
    subject_awareness: 'half-aware',
    cinematic_marker: 'body posture different ten seconds after the door closes than five seconds before',
  },
  'covert-reset-ritual': {
    id: 'covert-reset-ritual',
    observable_micro_action: 'a tiny physical movement repeated as a re-centring — a touch to the wedding ring, a thumb across the watch, a hand on the keys',
    internal_purpose: 'a body anchor to reset attention in public',
    duration_seconds: [1, 5],
    third_party_visibility: 'rare-catch',
    subject_awareness: 'aware-but-unnamed',
    cinematic_marker: 'a small repeated gesture that has nothing to do with the task',
  },
  'internal-monologue-muting': {
    id: 'internal-monologue-muting',
    observable_micro_action: 'gaze unfocuses, expression flattens, the inner voice has been turned off for thirty seconds',
    internal_purpose: 'stop the running commentary that has been depleting the day',
    duration_seconds: [10, 60],
    third_party_visibility: 'often-noticed',
    subject_awareness: 'half-aware',
    cinematic_marker: 'subject is in the room but the mind has gone quiet — the photograph catches the silence',
  },
  'silent-withdrawal': {
    id: 'silent-withdrawal',
    observable_micro_action: 'stops contributing to the conversation; still nodding; eye contact softer; the body is in the chair but the participation is over',
    internal_purpose: 'leave socially without leaving physically',
    duration_seconds: [60, 600],
    third_party_visibility: 'often-noticed',
    subject_awareness: 'aware-but-unnamed',
    cinematic_marker: 'present but no longer participating; the chair is full, the role is empty',
  },
  'emotional-time-stretching': {
    id: 'emotional-time-stretching',
    observable_micro_action: 'an impact arrives — the next two seconds run slow on purpose so the body can absorb without reacting',
    internal_purpose: 'buy the nervous system room to process before the social field demands a response',
    duration_seconds: [1, 3],
    third_party_visibility: 'rare-catch',
    subject_awareness: 'unconscious',
    cinematic_marker: 'expression has not changed yet but everything behind it has',
  },
  'breath-held-then-released': {
    id: 'breath-held-then-released',
    observable_micro_action: 'a held breath through a hard sentence — released only after the sentence is over',
    internal_purpose: 'survive the moment without flinching visibly',
    duration_seconds: [2, 8],
    third_party_visibility: 'invisible',
    subject_awareness: 'half-aware',
    cinematic_marker: 'shoulders drop visibly two seconds after the difficult line',
  },
  'jaw-unclench': {
    id: 'jaw-unclench',
    observable_micro_action: 'the jaw releases — first a small slack, then a longer one — when the meeting ends, when the call drops, when the front door closes',
    internal_purpose: 'release a tension the body had been carrying for hours',
    duration_seconds: [1, 4],
    third_party_visibility: 'rare-catch',
    subject_awareness: 'unconscious',
    cinematic_marker: 'face SHAPE different at 17:01 than at 16:59',
  },
  'two-second-eye-close': {
    id: 'two-second-eye-close',
    observable_micro_action: 'eyes close for two seconds — not a blink — between two demands of the day',
    internal_purpose: 'a micro-reset the calendar could not have allowed',
    duration_seconds: [1, 3],
    third_party_visibility: 'rare-catch',
    subject_awareness: 'half-aware',
    cinematic_marker: 'eyes closed though the room is busy',
  },
  'face-wash-as-reset': {
    id: 'face-wash-as-reset',
    observable_micro_action: 'cold water on the face — not for hygiene — to break the state',
    internal_purpose: 'a physical interrupt that the body trusts more than a thought',
    duration_seconds: [4, 12],
    third_party_visibility: 'invisible',
    subject_awareness: 'aware-but-unnamed',
    cinematic_marker: 'face wet, towel in hand, the bathroom mirror catches the moment between two days',
  },
};

const FAMILY_TO_COPING: Record<HumanState['family'], SilentCopingId[]> = {
  pressure:        ['breath-held-then-released', 'jaw-unclench', 'emotional-buffering'],
  fatigue:         ['private-decompression', 'two-second-eye-close', 'jaw-unclench'],
  overstimulation: ['internal-monologue-muting', 'two-second-eye-close'],
  numbness:        ['internal-monologue-muting', 'silent-withdrawal'],
  avoidance:       ['silent-withdrawal', 'covert-reset-ritual'],
  fragmentation:   ['covert-reset-ritual', 'face-wash-as-reset'],
  paralysis:       ['emotional-time-stretching', 'internal-monologue-muting'],
  collapse:        ['private-decompression', 'face-wash-as-reset'],
};

const CORE_TO_COPING: Partial<Record<string, SilentCopingId>> = {
  'silent-burnout':                 'private-decompression',
  'invisible-pressure':             'jaw-unclench',
  'hidden-anxiety':                 'breath-held-then-released',
  'emotional-numbness':             'internal-monologue-muting',
  'emotional-fragmentation':        'covert-reset-ritual',
  'social-mask-fatigue':            'silent-withdrawal',
  'overstimulation':                'two-second-eye-close',
  'inability-to-land':              'private-decompression',
};

export interface SilentCopingReading {
  primary: SilentCopingRecord | null;
  secondary: SilentCopingRecord | null;
  /** 0..10 — overall silent-coping signal strength. */
  silent_coping_score: number;
  /** 0..10 — how UNNAMED this move is in normal vocabulary (10 = no one
   *  has a word for it yet). */
  below_the_named: number;
  /** 0..10 — how visible to a third party. Low values are typical
   *  here — silent coping is silent. */
  visible_to_third_party: number;
  /** 0..10 — how visible to the subject themselves. */
  visible_to_subject: number;
  /** 0..10 — does the candidate banner make the coping visible
   *  without naming it? (the cinematic ideal). */
  captures_real_humanity: number;
  /** True when the truth NAMES the coping (suspicious — silent coping
   *  is supposed to be unnamed). */
  truth_names_the_move: boolean;
  notes: string[];
}

export interface SilentCopingInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

// "named" vocabulary: the spec's named patterns being said outright.
const NAMING_VOCAB = /\b(coping|cope|regulate|regulation|nervous system|self[- ]soothing|self[- ]regulation|reset)\b/i;
// Body-visible language: hints the truth observes a body, not a feeling.
const BODY_OBSERVATION = /\b(jaw|shoulder(s)?|breath|breathing|eyes? closed?|exhale(d|s)?|inhale(d|s)?|stand(s|ing)?|sat|sit(s|ting)?|pose|posture)\b/i;

export function readSilentCoping(input: SilentCopingInput): SilentCopingReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: SilentCopingId[] = [];
  for (const id of FAMILY_TO_COPING[state.family] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_COPING[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? SILENT_COPING[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? SILENT_COPING[candidates[1]]
    : null;

  // Below-the-named score — silent coping is by definition unnamed.
  // If the truth uses therapy/regulation vocabulary, this score drops.
  const truth_names_the_move = NAMING_VOCAB.test(truth.truth);
  let below_the_named = primary ? 8 : 0;
  if (truth_names_the_move) below_the_named = Math.max(0, below_the_named - 5);

  // Visibility-to-third-party: derived from the record.
  const visible_to_third_party = primary
    ? (primary.third_party_visibility === 'invisible' ? 1
       : primary.third_party_visibility === 'rare-catch' ? 3
       : 6)
    : 0;

  // Visibility-to-self.
  const visible_to_subject = primary
    ? (primary.subject_awareness === 'unconscious' ? 1
       : primary.subject_awareness === 'half-aware' ? 4
       : 7)
    : 0;

  // Captures real humanity: high when the truth OBSERVES a body
  // without NAMING the move.
  let captures_real_humanity = 0;
  if (primary && BODY_OBSERVATION.test(truth.truth)) captures_real_humanity += 7;
  if (primary && !truth_names_the_move) captures_real_humanity += 2;
  if (truth_names_the_move) captures_real_humanity = Math.max(0, captures_real_humanity - 3);
  captures_real_humanity = clamp10(captures_real_humanity);

  // Composite silent_coping_score.
  let score = 0;
  if (primary) score += 4;
  if (secondary) score += 1;
  score += (below_the_named / 10) * 2;
  score += (captures_real_humanity / 10) * 3;
  if (truth_names_the_move) score -= 2;
  const silent_coping_score = clamp10(score);

  if (primary) {
    notes.push(`silent coping: ${primary.id} — "${primary.cinematic_marker}"`);
    notes.push(`do not say "${primary.id.replace(/-/g, ' ')}" — observe the body, do not name the move`);
  } else {
    notes.push('no silent coping move identified');
  }
  if (truth_names_the_move) notes.push('WARNING: truth uses therapy / regulation vocabulary — silent coping is supposed to be unnamed');

  return {
    primary,
    secondary,
    silent_coping_score,
    below_the_named,
    visible_to_third_party,
    visible_to_subject,
    captures_real_humanity,
    truth_names_the_move,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
