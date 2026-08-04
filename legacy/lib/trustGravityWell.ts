/**
 * TRUST GRAVITY WELL (Phase 403 — Wave 16: Generative Civilization Presence)
 *
 * Trust as a gravitational well that pulls others in without effort.
 */

export interface TrustGravityWellReading {
  gravity_strength: number;
  pulling_without_effort: boolean;
  notes: string[];
}

export interface TrustGravityWellInput {
  livingReputation: number;
  trustNetGain: number;
}

export function readTrustGravityWell(input: TrustGravityWellInput): TrustGravityWellReading {
  const { livingReputation, trustNetGain } = input;
  const notes: string[] = [];

  const gravity_strength = round1(Math.min(10, livingReputation * 0.7 + Math.max(0, trustNetGain) * 0.5));
  const pulling_without_effort = gravity_strength >= 6;

  notes.push(`trust gravity well: ${pulling_without_effort ? 'PULLING' : 'thin'} (${gravity_strength}/10)`);
  return { gravity_strength, pulling_without_effort, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
