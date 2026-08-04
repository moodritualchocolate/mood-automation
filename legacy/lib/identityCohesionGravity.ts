/**
 * IDENTITY COHESION GRAVITY (Phase 388 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The gravitational pull that holds identity components together.
 */

export interface IdentityCohesionGravityReading {
  /** 0..10 — gravitational cohesion of identity. */
  cohesion: number;
  is_cohesive: boolean;
  notes: string[];
}

export interface IdentityCohesionGravityInput {
  invariantsScore: number;
  voiceConsistency: number;
  narrativeSovereignty: number;
}

export function readIdentityCohesionGravity(input: IdentityCohesionGravityInput): IdentityCohesionGravityReading {
  const { invariantsScore, voiceConsistency, narrativeSovereignty } = input;
  const notes: string[] = [];

  const cohesion = round1((invariantsScore * 0.4 + voiceConsistency * 0.3 + narrativeSovereignty * 0.3));
  const is_cohesive = cohesion >= 6;

  notes.push(`identity cohesion gravity: ${cohesion}/10 — ${is_cohesive ? 'cohesive' : 'fragmenting'}`);
  return { cohesion, is_cohesive, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
