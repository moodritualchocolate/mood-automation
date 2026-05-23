/**
 * IDENTITY CORRUPTION CONTAINMENT (Phase 379 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Contains an identified corruption so it does not spread to other
 * parts of identity.
 */

export interface IdentityCorruptionContainmentReading {
  /** True when containment is in effect. */
  contained: boolean;
  containment_action: string;
  notes: string[];
}

export interface IdentityCorruptionContainmentInput {
  corruptionDetected: boolean;
  containmentAvailable: boolean;
}

export function readIdentityCorruptionContainment(input: IdentityCorruptionContainmentInput): IdentityCorruptionContainmentReading {
  const { corruptionDetected, containmentAvailable } = input;
  const notes: string[] = [];

  const contained = corruptionDetected && containmentAvailable;
  const containment_action = !corruptionDetected ? 'no containment needed'
    : contained ? 'corruption isolated — preventing spread'
    : 'corruption detected but containment unavailable — spread risk';

  notes.push(`identity corruption containment: ${containment_action}`);
  return { contained, containment_action, notes };
}
