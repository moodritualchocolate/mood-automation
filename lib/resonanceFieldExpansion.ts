/**
 * RESONANCE FIELD EXPANSION (Phase 407 — Wave 16: Generative Civilization Presence)
 *
 * The radius of the resonance field expanding outward over cycles.
 */

export interface ResonanceFieldExpansionReading {
  expanding: boolean;
  field_radius: number;
  notes: string[];
}

export interface ResonanceFieldExpansionInput {
  meaningPropagated: number;
  trustGravity: number;
}

export function readResonanceFieldExpansion(input: ResonanceFieldExpansionInput): ResonanceFieldExpansionReading {
  const { meaningPropagated, trustGravity } = input;
  const notes: string[] = [];

  const field_radius = round1(Math.min(10, meaningPropagated * 0.6 + trustGravity * 0.1));
  const expanding = field_radius >= 3 && meaningPropagated >= 2;

  notes.push(`resonance field expansion: ${expanding ? 'EXPANDING' : 'static'} (radius ${field_radius}/10)`);
  return { expanding, field_radius, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
