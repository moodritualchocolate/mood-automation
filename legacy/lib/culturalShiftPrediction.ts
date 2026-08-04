/**
 * CULTURAL SHIFT PREDICTION (Phase 154 — Wave 11: Strategic Future Intelligence)
 *
 * Culture moves. This module predicts the shift the organism will be
 * speaking into a season or two from now — toward fatigue, toward
 * searching, toward noise — and how far away that shift is.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export type CulturalShift =
  | 'toward-deeper-fatigue'
  | 'toward-quiet-searching'
  | 'toward-louder-noise'
  | 'toward-renewed-attention';

export interface CulturalShiftReading {
  predicted_shift: CulturalShift;
  /** 0..10 — how large the predicted shift is. */
  shift_magnitude: number;
  /** Roughly how many cycles away the shift is. */
  shift_horizon: number;
  shift_directive: string;
  notes: string[];
}

export interface CulturalShiftInput {
  worldState: ExecutiveWorldState;
}

export function predictCulturalShift(input: CulturalShiftInput): CulturalShiftReading {
  const { worldState } = input;
  const notes: string[] = [];

  let predicted_shift: CulturalShift;
  let shift_directive: string;
  if (worldState.collective_exhaustion >= 7) {
    predicted_shift = 'toward-deeper-fatigue';
    shift_directive = 'position for a tired audience — quieter, slower, less often';
  } else if (worldState.trust_erosion >= 6 || worldState.emotional_volatility >= 7) {
    predicted_shift = 'toward-quiet-searching';
    shift_directive = 'position as the steady honest voice an unsettled audience returns to';
  } else if (worldState.attention_chaos >= 7) {
    predicted_shift = 'toward-louder-noise';
    shift_directive = 'position to hold one unbreakable quiet note while the noise rises';
  } else {
    predicted_shift = 'toward-renewed-attention';
    shift_directive = 'position to deepen — the audience will have bandwidth to receive it';
  }

  const shift_magnitude = round1(Math.min(10,
    (worldState.emotional_volatility + worldState.attention_chaos + worldState.collective_exhaustion) / 3));
  const shift_horizon = shift_magnitude >= 7 ? 1 : shift_magnitude >= 4 ? 2 : 4;

  notes.push(`cultural shift prediction: ${predicted_shift} (magnitude ${shift_magnitude}/10, ~${shift_horizon} cycles out)`);
  return { predicted_shift, shift_magnitude, shift_horizon, shift_directive, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
