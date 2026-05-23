/**
 * RESONANCE FIELD DIRECTION (Phase 274 — Wave 14: Live Civilization Coupling)
 *
 * Resonance has a direction in the field — which way it is moving
 * (toward the brand, away from it, sideways).
 */

export type ResonanceDirection = 'toward-brand' | 'away-from-brand' | 'sideways' | 'still';

export interface ResonanceFieldDirectionReading {
  direction: ResonanceDirection;
  /** True when resonance is flowing toward the brand. */
  flowing_toward_brand: boolean;
  notes: string[];
}

export interface ResonanceFieldDirectionInput {
  resonanceVelocity: number;
  brandReceivedValence: number;
}

export function readResonanceFieldDirection(input: ResonanceFieldDirectionInput): ResonanceFieldDirectionReading {
  const { resonanceVelocity, brandReceivedValence } = input;
  const notes: string[] = [];

  const direction: ResonanceDirection =
    resonanceVelocity >= 0.5 && brandReceivedValence > 1 ? 'toward-brand' :
    resonanceVelocity <= -0.5 && brandReceivedValence < -1 ? 'away-from-brand' :
    Math.abs(resonanceVelocity) < 0.3 ? 'still' : 'sideways';

  const flowing_toward_brand = direction === 'toward-brand';
  notes.push(`resonance field direction: ${direction}`);
  return { direction, flowing_toward_brand, notes };
}
