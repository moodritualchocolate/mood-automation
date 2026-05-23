/**
 * IDENTITY SOVEREIGNTY GOVERNOR (Phase 397 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Governs the whole identity preservation layer — sovereign, guarded,
 * compromising, captured.
 */

export type IdentityGovernance = 'sovereign' | 'guarded' | 'compromising' | 'captured';

export interface IdentitySovereigntyGovernorReading {
  governance: IdentityGovernance;
  identity_governed: boolean;
  reason: string;
  notes: string[];
}

export interface IdentitySovereigntyGovernorInput {
  invariantsIntact: boolean;
  captured: boolean;
  driftPresent: boolean;
  truthHeld: boolean;
}

export function readIdentitySovereigntyGovernor(input: IdentitySovereigntyGovernorInput): IdentitySovereigntyGovernorReading {
  const { invariantsIntact, captured, driftPresent, truthHeld } = input;
  const notes: string[] = [];

  let governance: IdentityGovernance;
  let reason: string;

  if (captured) { governance = 'captured'; reason = 'the brand has been captured by external pressure'; }
  else if (!invariantsIntact || !truthHeld) { governance = 'compromising'; reason = 'invariants or truth are bending under pressure'; }
  else if (driftPresent) { governance = 'guarded'; reason = 'drift is present but invariants hold — guarded sovereignty'; }
  else { governance = 'sovereign'; reason = 'invariants intact, truth held, no drift — sovereign identity'; }

  const identity_governed = governance === 'sovereign' || governance === 'guarded';

  notes.push(`identity sovereignty governor: ${governance} — ${reason}`);
  return { governance, identity_governed, reason, notes };
}
