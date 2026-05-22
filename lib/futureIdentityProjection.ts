/**
 * FUTURE IDENTITY PROJECTION (Phase 175 — Wave 11: Strategic Future Intelligence)
 *
 * If the organism keeps making the decisions it is making now, who
 * does it become? This module projects the identity forward and
 * checks whether the projected self is still true to the founding one.
 */

export interface FutureIdentityReading {
  projected_identity: string;
  /** True when the projected identity is still true to the founding one. */
  identity_projection_is_true: boolean;
  /** 0..10 — how far the projected identity drifts from the founding one. */
  projection_drift: number;
  notes: string[];
}

export interface FutureIdentityInput {
  /** 0..10 — current identity strength. */
  identityStrength: number;
  /** 0..10 — drift of the projected narrative from its origin. */
  narrativeDrift: number;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
  /** True when the organism has been optimizing for the present. */
  optimizingForNow: boolean;
}

export function projectFutureIdentity(input: FutureIdentityInput): FutureIdentityReading {
  const { identityStrength, narrativeDrift, strategicDebt, optimizingForNow } = input;
  const notes: string[] = [];

  let projection_drift = 0;
  projection_drift += narrativeDrift * 0.4;
  projection_drift += strategicDebt * 0.3;
  projection_drift += (10 - identityStrength) * 0.3;
  if (optimizingForNow) projection_drift += 1.5;
  projection_drift = round1(Math.max(0, Math.min(10, projection_drift)));

  const identity_projection_is_true = projection_drift < 5;

  const projected_identity = identity_projection_is_true
    ? 'the same campaign, deeper — a voice that kept its word to itself'
    : projection_drift >= 7.5
      ? 'a campaign that became what it once refused to be — an optimizer like any other'
      : 'a campaign half its founding self — recognisable, but compromised at the edges';

  notes.push(`future identity projection: drift ${projection_drift}/10 — becomes "${projected_identity}"`);
  return { projected_identity, identity_projection_is_true, projection_drift, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
