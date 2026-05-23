/**
 * CORE PRINCIPLE VIOLATION SCANNER (Phase 375 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Scans specifically for violations of the brand's stated core
 * principles — not values in general, but principles declared as
 * lines that will not be crossed.
 */

export interface CorePrincipleViolationReading {
  /** True when a core principle was violated. */
  principle_violated: boolean;
  violation_name: string | null;
  notes: string[];
}

export interface CorePrincipleViolationInput {
  noPerformedCareViolated: boolean;
  noManipulationViolated: boolean;
  noCrisisRidingViolated: boolean;
}

export function readCorePrincipleViolationScanner(input: CorePrincipleViolationInput): CorePrincipleViolationReading {
  const { noPerformedCareViolated, noManipulationViolated, noCrisisRidingViolated } = input;
  const notes: string[] = [];

  const violation_name = noManipulationViolated ? 'no-manipulation'
    : noPerformedCareViolated ? 'no-performed-care'
    : noCrisisRidingViolated ? 'no-crisis-riding'
    : null;

  const principle_violated = violation_name !== null;

  notes.push(`core principle violation scanner: ${principle_violated ? `VIOLATED — ${violation_name}` : 'clean'}`);
  return { principle_violated, violation_name, notes };
}
