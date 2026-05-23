/**
 * REPUTATION FIELD GRADIENT (Phase 285 — Wave 14: Live Civilization Coupling)
 *
 * Reputation has a gradient across audience segments — pointing
 * toward those who trust the brand most and least.
 */

export interface ReputationFieldGradientReading {
  /** -10..10 — gradient direction & magnitude. */
  gradient: number;
  /** True when reputation is unevenly distributed. */
  field_is_uneven: boolean;
  notes: string[];
}

export interface ReputationFieldGradientInput {
  livingReputation: number;
  fieldVariance: number;
}

export function readReputationFieldGradient(input: ReputationFieldGradientInput): ReputationFieldGradientReading {
  const { livingReputation, fieldVariance } = input;
  const notes: string[] = [];

  const gradient = round1((livingReputation - 5) * (fieldVariance / 10));
  const field_is_uneven = fieldVariance >= 5;

  notes.push(`reputation field gradient: ${gradient} (${field_is_uneven ? 'uneven' : 'even'})`);
  return { gradient, field_is_uneven, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
