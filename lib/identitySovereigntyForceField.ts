/**
 * IDENTITY SOVEREIGNTY FORCE FIELD (Phase 389 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The active field around the brand that repels external pressure.
 */

export interface IdentitySovereigntyForceFieldReading {
  /** True when the force field is active. */
  field_active: boolean;
  /** 0..10 — field strength. */
  field_strength: number;
  notes: string[];
}

export interface IdentitySovereigntyForceFieldInput {
  sovereignty: number;
  pressureRepelled: boolean;
}

export function readIdentitySovereigntyForceField(input: IdentitySovereigntyForceFieldInput): IdentitySovereigntyForceFieldReading {
  const { sovereignty, pressureRepelled } = input;
  const notes: string[] = [];

  const field_strength = round1(Math.min(10, sovereignty + (pressureRepelled ? 1 : 0)));
  const field_active = field_strength >= 5;

  notes.push(`identity sovereignty force field: ${field_active ? 'ACTIVE' : 'dormant'} (${field_strength}/10)`);
  return { field_active, field_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
