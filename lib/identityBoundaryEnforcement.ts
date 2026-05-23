/**
 * IDENTITY BOUNDARY ENFORCEMENT (Phase 364 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Enforces the things the brand will never do, no matter the pressure.
 */

export interface IdentityBoundaryEnforcementReading {
  within_boundary: boolean;
  boundary_crossed: string | null;
  notes: string[];
}

export interface IdentityBoundaryEnforcementInput {
  contradictedCoreValue: boolean;
  betrayedFoundingPromise: boolean;
  mockedOwnAudience: boolean;
}

export function readIdentityBoundaryEnforcement(input: IdentityBoundaryEnforcementInput): IdentityBoundaryEnforcementReading {
  const { contradictedCoreValue, betrayedFoundingPromise, mockedOwnAudience } = input;
  const notes: string[] = [];

  const boundary_crossed = betrayedFoundingPromise ? 'a founding promise was betrayed'
    : contradictedCoreValue ? 'a core value was contradicted'
    : mockedOwnAudience ? 'the brand mocked its own audience'
    : null;

  const within_boundary = boundary_crossed === null;

  notes.push(`identity boundary enforcement: ${within_boundary ? 'within' : `CROSSED — ${boundary_crossed}`}`);
  return { within_boundary, boundary_crossed, notes };
}
