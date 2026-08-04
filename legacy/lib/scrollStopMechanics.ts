/**
 * SCROLL-STOP MECHANICS (Phase 29 — Attention Physics / Wave 2)
 *
 * Models why a human stops scrolling. Not because something is loud —
 * because something INTERRUPTS AN INTERNAL PATTERN. Loud, contrast,
 * product size, typography size: none of these are attention.
 */

import type { CreativeDirection, HumanTruth } from '@/core/types';
import type { Reaction } from './humanReaction';

export interface ScrollStopMechanicsReading {
  /** 0..10 — probability the banner stops a scroll. */
  scroll_stop_probability: number;
  /** True when the stop relies on loudness / size, not truth. */
  relies_on_loudness: boolean;
  /** True when the interruption is a genuine internal-pattern break. */
  interruption_is_true: boolean;
  notes: string[];
}

export interface ScrollStopMechanicsInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  /** The 0.3s reaction — a fast recognition is a true interruption. */
  reactionAt03s: Reaction;
}

const RECOGNITION_REACTIONS = new Set<Reaction>(['recognition', 'emotional tension', 'intimacy', 'discomfort']);

export function readScrollStopMechanics(input: ScrollStopMechanicsInput): ScrollStopMechanicsReading {
  const { truth, direction, reactionAt03s } = input;
  const notes: string[] = [];

  // Loud signature: loud typography + low restraint.
  const loudTypography = direction.typographyDominance === 'loud';
  const lowRestraint = direction.restraint < 0.4;
  const relies_on_loudness = loudTypography && lowRestraint;

  // A true interruption: the 0.3s reaction is a recognition-class
  // reaction AND the truth carries a real tension.
  const fastRecognition = RECOGNITION_REACTIONS.has(reactionAt03s);
  const hasTension = truth.tension.trim().length > 8;
  const interruption_is_true = fastRecognition && hasTension && !relies_on_loudness;

  let scroll_stop_probability = 0;
  if (interruption_is_true) scroll_stop_probability += 7;
  if (fastRecognition) scroll_stop_probability += 1.5;
  if (hasTension) scroll_stop_probability += 1.5;
  if (relies_on_loudness) scroll_stop_probability -= 3;   // loud is not attention
  scroll_stop_probability = Math.max(0, Math.min(10, round1(scroll_stop_probability)));

  if (relies_on_loudness) notes.push('scroll-stop: the banner relies on loudness, not on truth — loud is not attention');
  if (interruption_is_true) notes.push('scroll-stop: a true internal-pattern interruption — recognition + tension');
  else notes.push('scroll-stop: the interruption is weak — no internal pattern is broken');

  return { scroll_stop_probability, relies_on_loudness, interruption_is_true, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
