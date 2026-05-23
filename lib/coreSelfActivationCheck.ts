/**
 * CORE SELF ACTIVATION CHECK (Phase 382 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Checks that the brand's core self is actually present and active
 * in this run, not just nominally invoked.
 */

export interface CoreSelfActivationCheckReading {
  core_active: boolean;
  notes: string[];
}

export interface CoreSelfActivationCheckInput {
  invariantsIntact: boolean;
  sovereignty: number;
  identityHeld: boolean;
}

export function readCoreSelfActivationCheck(input: CoreSelfActivationCheckInput): CoreSelfActivationCheckReading {
  const { invariantsIntact, sovereignty, identityHeld } = input;
  const notes: string[] = [];

  const core_active = invariantsIntact && sovereignty >= 5 && identityHeld;

  notes.push(`core self activation check: ${core_active ? 'ACTIVE' : 'dormant'}`);
  return { core_active, notes };
}
