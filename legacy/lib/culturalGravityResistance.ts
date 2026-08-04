/**
 * CULTURAL GRAVITY RESISTANCE (Phase 367 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Resistance to cultural gravity wells — strong attractors that pull
 * any voice nearby into the same shape.
 */

export interface CulturalGravityResistanceReading {
  /** True when the brand is resisting the gravity well. */
  resisting: boolean;
  /** 0..10 — strength of the gravity. */
  gravity_strength: number;
  notes: string[];
}

export interface CulturalGravityResistanceInput {
  gravityStrength: number;
  brandStillItself: boolean;
}

export function readCulturalGravityResistance(input: CulturalGravityResistanceInput): CulturalGravityResistanceReading {
  const { gravityStrength, brandStillItself } = input;
  const notes: string[] = [];

  const resisting = brandStillItself || gravityStrength < 5;

  notes.push(`cultural gravity resistance: ${resisting ? 'resisting' : 'PULLED IN'} (gravity ${gravityStrength}/10)`);
  return { resisting, gravity_strength: gravityStrength, notes };
}
