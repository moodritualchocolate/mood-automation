/**
 * FIRST-SECOND RECOGNITION (Phase 29 — Attention Physics / Wave 2)
 *
 * Models the first 0.3s, 1s, and 3s of a viewer's encounter. True
 * attention is INTERNAL RECOGNITION arriving fast — the viewer seeing
 * themselves before they have decided to look.
 */

import type { Reaction } from './humanReaction';

export interface FirstSecondRecognitionReading {
  /** 0..10 — how fast recognition arrives (10 = at 0.3s). */
  recognition_speed: number;
  /** Seconds before recognition lands (0.3 / 1 / 3 / never). */
  recognition_delay: 0.3 | 1 | 3 | null;
  /** 0..10 — what the banner leaves after 3 seconds. */
  three_second_residue: number;
  /** True when there is a genuine first-second emotional hook. */
  has_first_second_hook: boolean;
  notes: string[];
}

export interface FirstSecondRecognitionInput {
  at_0_3s: Reaction;
  at_1s: Reaction;
  at_3s: Reaction;
}

const RECOGNITION = new Set<Reaction>(['recognition', 'emotional tension', 'intimacy', 'validation', 'discomfort']);
const RESIDUE_STRONG = new Set<Reaction>(['emotional tension', 'recognition', 'intimacy', 'discomfort']);

export function readFirstSecondRecognition(input: FirstSecondRecognitionInput): FirstSecondRecognitionReading {
  const { at_0_3s, at_1s, at_3s } = input;
  const notes: string[] = [];

  let recognition_delay: FirstSecondRecognitionReading['recognition_delay'] = null;
  if (RECOGNITION.has(at_0_3s)) recognition_delay = 0.3;
  else if (RECOGNITION.has(at_1s)) recognition_delay = 1;
  else if (RECOGNITION.has(at_3s)) recognition_delay = 3;

  const recognition_speed =
    recognition_delay === 0.3 ? 10 :
    recognition_delay === 1 ? 7 :
    recognition_delay === 3 ? 4 : 1;

  const three_second_residue = RESIDUE_STRONG.has(at_3s) ? 8
    : at_3s === 'curiosity' ? 6
    : at_3s === 'aspiration' ? 4 : 2;

  const has_first_second_hook = recognition_delay === 0.3 || recognition_delay === 1;

  notes.push(`first-second recognition: lands at ${recognition_delay ?? 'never'}s — speed ${recognition_speed}/10, 3s residue ${three_second_residue}/10`);
  if (!has_first_second_hook) notes.push('WARNING: no first-second emotional hook — recognition arrives too late or not at all');

  return { recognition_speed, recognition_delay, three_second_residue, has_first_second_hook, notes };
}
