/**
 * IDENTITY INVARIANT VALIDATOR (Phase 330 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Second-order check on the invariants — catches near-violations
 * before they become real violations.
 */

export interface IdentityInvariantValidatorReading {
  /** True when invariants are robust — far from violation. */
  invariants_robust: boolean;
  /** 0..10 — margin of safety. */
  margin_of_safety: number;
  notes: string[];
}

export interface IdentityInvariantValidatorInput {
  invariantsIntactScore: number;
  driftMagnitude: number;
  capturePressure: number;
}

export function readIdentityInvariantValidator(input: IdentityInvariantValidatorInput): IdentityInvariantValidatorReading {
  const { invariantsIntactScore, driftMagnitude, capturePressure } = input;
  const notes: string[] = [];

  const margin_of_safety = round1(Math.max(0, invariantsIntactScore - driftMagnitude * 0.4 - capturePressure * 0.3));
  const invariants_robust = margin_of_safety >= 5;

  notes.push(`identity invariant validator: margin of safety ${margin_of_safety}/10 — ${invariants_robust ? 'robust' : 'NEAR VIOLATION'}`);
  return { invariants_robust, margin_of_safety, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
