/**
 * TRUST SHIFT DETECTION (Phase 222 — Wave 13: Reality Feedback Infrastructure)
 *
 * Trust does not change in chunks — it shifts. This module detects the
 * direction and magnitude of the shift this cycle, so the organism
 * knows whether its actions are accruing trust or quietly spending it.
 */

export type TrustShiftDirection = 'gaining' | 'stable' | 'eroding';

export interface TrustShiftReading {
  shift_direction: TrustShiftDirection;
  /** -10..10 — net trust shift observed this cycle. */
  shift_magnitude: number;
  /** True when the shift is the kind that compounds over cycles. */
  shift_is_compounding: boolean;
  shift_note: string;
  notes: string[];
}

export interface TrustShiftInput {
  /** -10..10 — current trust net gain across the campaign's life. */
  trustNetGain: number;
  /** True when reactions came back as forming trust. */
  trustForming: boolean;
  /** True when reactions came back as decaying trust. */
  trustDecaying: boolean;
  /** 0..10 — resonance the action carried. */
  actionResonance: number;
}

export function readTrustShiftDetection(input: TrustShiftInput): TrustShiftReading {
  const { trustNetGain, trustForming, trustDecaying, actionResonance } = input;
  const notes: string[] = [];

  let shift_magnitude = 0;
  if (trustForming) shift_magnitude += 0.6 + actionResonance * 0.08;
  if (trustDecaying) shift_magnitude -= 0.8 + (10 - actionResonance) * 0.06;
  shift_magnitude = round1(Math.max(-10, Math.min(10, shift_magnitude)));

  const shift_direction: TrustShiftDirection =
    shift_magnitude >= 0.4 ? 'gaining' :
    shift_magnitude <= -0.4 ? 'eroding' : 'stable';

  // A shift compounds when it pushes a trend that already exists in
  // the same direction.
  const shift_is_compounding =
    (shift_direction === 'gaining' && trustNetGain >= 1) ||
    (shift_direction === 'eroding' && trustNetGain <= -1);

  const shift_note = shift_direction === 'gaining'
    ? `trust shifted up by ${shift_magnitude} this cycle — ${shift_is_compounding ? 'compounding the trend' : 'reversing the trend'}`
    : shift_direction === 'eroding'
      ? `trust shifted DOWN by ${Math.abs(shift_magnitude)} this cycle — ${shift_is_compounding ? 'compounding the erosion' : 'arresting the trend'}`
      : 'trust held flat this cycle — no detectable shift';

  notes.push(`trust shift detection: ${shift_direction} (${shift_magnitude}) — ${shift_note}`);
  return { shift_direction, shift_magnitude, shift_is_compounding, shift_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
