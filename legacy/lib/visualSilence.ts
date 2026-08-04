/**
 * VISUAL SILENCE (Phase 30 — Visual Cognition / Wave 2)
 *
 * Reads the silence of a frame — the negative space — and asks
 * whether that silence has an EMOTIONAL FUNCTION or is merely empty.
 * Silence must do work; empty space does not.
 */

import type { CompositionPlan, CreativeDirection } from '@/core/types';

export interface VisualSilenceReading {
  /** 0..10 — how much silence the frame holds. */
  silence_amount: number;
  /** 0..10 — how much emotional function the silence performs. */
  silence_function: number;
  /** True when the silence is emotional, not empty. */
  silence_is_emotional: boolean;
  notes: string[];
}

export interface VisualSilenceInput {
  composition: CompositionPlan;
  direction: CreativeDirection;
}

export function readVisualSilence(input: VisualSilenceInput): VisualSilenceReading {
  const { composition, direction } = input;
  const notes: string[] = [];

  const f = composition.focal;
  const focalArea = f.w * f.h;
  const productArea = composition.productZone ? composition.productZone.w * composition.productZone.h : 0;
  const occupied = Math.min(1, focalArea + productArea);
  const silence_amount = round1(Math.min(10, (1 - occupied) * 11));

  // Silence has function when restraint is deliberate, the bias is
  // directional (not 'center'), and the emotional pacing is quiet /
  // interrupted — silence that holds a feeling.
  let silence_function = 4;
  if (direction.restraint >= 0.6) silence_function += 2;
  if (composition.negativeSpaceBias !== 'center') silence_function += 2;
  if (direction.emotionalPacing === 'quiet' || direction.emotionalPacing === 'interrupted'
    || direction.emotionalPacing === 'collapsed') silence_function += 2;
  // Too much silence with no restraint = empty, not emotional.
  if (silence_amount >= 7 && direction.restraint < 0.4) silence_function -= 3;
  silence_function = clamp10(round1(silence_function));

  const silence_is_emotional = silence_amount >= 3 && silence_function >= 6;

  notes.push(`visual silence: amount ${silence_amount}/10, function ${silence_function}/10`);
  if (silence_amount >= 5 && !silence_is_emotional) {
    notes.push('visual silence: the frame is empty, not silent — the negative space has no emotional function');
  }

  return { silence_amount, silence_function, silence_is_emotional, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
