/**
 * SENTIMENT FIELD GRADIENT (Phase 272 — Wave 14: Live Civilization Coupling)
 *
 * The sentiment field is not uniform — it has gradients that point
 * toward the warmer and cooler parts of the audience.
 */

export interface SentimentFieldGradientReading {
  /** -10..10 — direction & magnitude of the gradient. */
  gradient: number;
  /** True when the gradient is steep enough to require navigation. */
  gradient_is_steep: boolean;
  gradient_note: string;
  notes: string[];
}

export interface SentimentFieldGradientInput {
  fieldMean: number;
  fieldVariance: number;
}

export function readSentimentFieldGradient(input: SentimentFieldGradientInput): SentimentFieldGradientReading {
  const { fieldMean, fieldVariance } = input;
  const notes: string[] = [];

  const gradient = round1(fieldMean * (fieldVariance / 10));
  const gradient_is_steep = Math.abs(gradient) >= 2 || fieldVariance >= 6;

  const gradient_note = !gradient_is_steep
    ? 'the field is flat — sentiment is consistent across the audience'
    : gradient > 0
      ? 'the field tilts warm — there is a positive gradient to navigate toward'
      : 'the field tilts cool — there is a negative gradient to navigate away from';

  notes.push(`sentiment field gradient: ${gradient} (${gradient_is_steep ? 'steep' : 'flat'}) — ${gradient_note}`);
  return { gradient, gradient_is_steep, gradient_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
