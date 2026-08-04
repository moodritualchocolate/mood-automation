/**
 * SYMBOLIC WORLDBUILDING RUNTIME (Phase 404 — Wave 16: Generative Civilization Presence)
 *
 * Builds the symbolic world the brand inhabits — its imagery,
 * vocabulary, metaphors — as a coherent place others can enter.
 */

export interface SymbolicWorldbuildingReading {
  world_is_inhabitable: boolean;
  world_coherence: number;
  notes: string[];
}

export interface SymbolicWorldbuildingInput {
  symbolDensity: number;
  symbolCoherence: number;
}

export function readSymbolicWorldbuildingRuntime(input: SymbolicWorldbuildingInput): SymbolicWorldbuildingReading {
  const { symbolDensity, symbolCoherence } = input;
  const notes: string[] = [];

  const world_coherence = round1((symbolDensity * 0.5 + symbolCoherence * 0.5));
  const world_is_inhabitable = world_coherence >= 6;

  notes.push(`symbolic worldbuilding runtime: ${world_is_inhabitable ? 'INHABITABLE' : 'thin'} (${world_coherence}/10)`);
  return { world_is_inhabitable, world_coherence, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
