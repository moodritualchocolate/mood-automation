/**
 * IDENTITY INTEGRITY COHERENCE VALIDATOR (Phase 396 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Checks the identity layer's conclusions agree with each other — no
 * "sovereign" verdict while "captured" is also true.
 */

export interface IdentityIntegrityCoherenceReading {
  coherent: boolean;
  incoherences: string[];
  notes: string[];
}

export interface IdentityIntegrityCoherenceInput {
  reportingSovereign: boolean;
  reportingCaptured: boolean;
  reportingDrift: boolean;
  reportingInvariantsIntact: boolean;
}

export function readIdentityIntegrityCoherenceValidator(input: IdentityIntegrityCoherenceInput): IdentityIntegrityCoherenceReading {
  const { reportingSovereign, reportingCaptured, reportingDrift, reportingInvariantsIntact } = input;
  const notes: string[] = [];

  const incoherences: string[] = [];
  if (reportingSovereign && reportingCaptured) incoherences.push('sovereign and captured at once');
  if (reportingInvariantsIntact && reportingDrift) incoherences.push('invariants intact yet drift reported');

  const coherent = incoherences.length === 0;

  notes.push(`identity integrity coherence validator: ${coherent ? 'coherent' : `${incoherences.length} incoherence(s)`}`);
  return { coherent, incoherences, notes };
}
