/**
 * IDENTITY CENTER OF GRAVITY (Phase 374 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Names the brand's current center of gravity — the thing it actually
 * orbits around, which should be its founding truth, not an external.
 */

export type CenterOfGravity = 'founding-truth' | 'audience-approval' | 'trend-current' | 'crisis-of-the-day';

export interface IdentityCenterOfGravityReading {
  center: CenterOfGravity;
  /** True when the center is the right one. */
  center_is_correct: boolean;
  notes: string[];
}

export interface IdentityCenterOfGravityInput {
  orbitingFoundingTruth: boolean;
  orbitingApproval: boolean;
  orbitingTrend: boolean;
  orbitingCrisis: boolean;
}

export function readIdentityCenterOfGravity(input: IdentityCenterOfGravityInput): IdentityCenterOfGravityReading {
  const { orbitingFoundingTruth, orbitingApproval, orbitingTrend, orbitingCrisis } = input;
  const notes: string[] = [];

  const center: CenterOfGravity =
    orbitingCrisis ? 'crisis-of-the-day' :
    orbitingTrend ? 'trend-current' :
    orbitingApproval ? 'audience-approval' :
    'founding-truth';

  const center_is_correct = center === 'founding-truth' && orbitingFoundingTruth;

  notes.push(`identity center of gravity: ${center} — ${center_is_correct ? 'CORRECT' : 'misaligned'}`);
  return { center, center_is_correct, notes };
}
