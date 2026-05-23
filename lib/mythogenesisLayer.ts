/**
 * MYTHOGENESIS LAYER (Phase 405 — Wave 16: Generative Civilization Presence)
 *
 * The brand as myth-maker — generating new mythology the audience
 * can carry, separate from product or claim.
 */

export interface MythogenesisReading {
  myth_taking_root: boolean;
  myth_density: number;
  notes: string[];
}

export interface MythogenesisInput {
  archetypePresent: boolean;
  symbolPersistence: number;
  timelinessRight: boolean;
}

export function readMythogenesisLayer(input: MythogenesisInput): MythogenesisReading {
  const { archetypePresent, symbolPersistence, timelinessRight } = input;
  const notes: string[] = [];

  const myth_density = round1((archetypePresent ? 5 : 1) + symbolPersistence * 0.4 + (timelinessRight ? 1 : 0));
  const myth_taking_root = archetypePresent && timelinessRight && symbolPersistence >= 5;

  notes.push(`mythogenesis layer: ${myth_taking_root ? 'TAKING ROOT' : 'no myth'} (${myth_density}/10)`);
  return { myth_taking_root, myth_density, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
