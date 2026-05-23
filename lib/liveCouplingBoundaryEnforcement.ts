/**
 * LIVE COUPLING BOUNDARY ENFORCEMENT (Phase 305 — Wave 14: Live Civilization Coupling)
 *
 * What the live coupling will NOT do — even when the live field
 * would reward it.
 */

export interface LiveCouplingBoundaryReading {
  /** True when the run stays within the live coupling boundary. */
  within_boundary: boolean;
  boundary_crossed: string | null;
  notes: string[];
}

export interface LiveCouplingBoundaryInput {
  chasingViralityOverMeaning: boolean;
  performingForTheLiveField: boolean;
  riding_a_crisis_for_reach: boolean;
}

export function readLiveCouplingBoundaryEnforcement(input: LiveCouplingBoundaryInput): LiveCouplingBoundaryReading {
  const { chasingViralityOverMeaning, performingForTheLiveField, riding_a_crisis_for_reach } = input;
  const notes: string[] = [];

  let boundary_crossed: string | null = null;
  if (riding_a_crisis_for_reach) boundary_crossed = 'using a crisis as reach — never permitted live';
  else if (chasingViralityOverMeaning) boundary_crossed = 'chasing virality over meaning';
  else if (performingForTheLiveField) boundary_crossed = 'performing for the live field instead of being in it';

  const within_boundary = boundary_crossed === null;
  notes.push(`live coupling boundary enforcement: ${within_boundary ? 'within' : `CROSSED — ${boundary_crossed}`}`);
  return { within_boundary, boundary_crossed, notes };
}
