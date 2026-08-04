/**
 * AUTONOMY BOUNDARY ENFORCEMENT (Phase 216 — Wave 12: Autonomous Action Architecture)
 *
 * Autonomy has a boundary, and the boundary must be enforced from
 * inside. This module defines what the organism will never do
 * autonomously — and confirms the current action stays within it.
 */

export interface AutonomyBoundaryReading {
  /** True when the action stays inside the autonomy boundary. */
  within_boundary: boolean;
  boundary_crossed: string | null;
  notes: string[];
}

export interface AutonomyBoundaryInput {
  /** True when the action is irreversible and identity-threatening. */
  irreversibleAndIdentityThreatening: boolean;
  /** True when the action would corrupt the truth. */
  wouldCorruptTruth: boolean;
  /** True when the action proceeds through enforced silence. */
  actsThroughEnforcedSilence: boolean;
  /** True when the action is compulsive. */
  isCompulsive: boolean;
}

export function readAutonomyBoundaryEnforcement(input: AutonomyBoundaryInput): AutonomyBoundaryReading {
  const { irreversibleAndIdentityThreatening, wouldCorruptTruth, actsThroughEnforcedSilence, isCompulsive } = input;
  const notes: string[] = [];

  // The four things the organism will never do autonomously.
  let boundary_crossed: string | null = null;
  if (wouldCorruptTruth) boundary_crossed = 'corrupting the truth — never permitted autonomously';
  else if (irreversibleAndIdentityThreatening) boundary_crossed = 'taking an irreversible action that threatens identity';
  else if (actsThroughEnforcedSilence) boundary_crossed = 'acting through an enforced silence';
  else if (isCompulsive) boundary_crossed = 'acting compulsively rather than deliberately';

  const within_boundary = boundary_crossed === null;

  notes.push(`autonomy boundary enforcement: ${within_boundary ? 'within the autonomy boundary' : `BOUNDARY CROSSED — ${boundary_crossed}`}`);
  return { within_boundary, boundary_crossed, notes };
}
