/**
 * STRATEGIC EVOLUTION GOVERNANCE (Phase 86 — Wave 7: Reality Organism)
 *
 * The organism must evolve — but slowly, and without losing itself.
 * This module governs the PACE of evolution: it permits gradual,
 * identity-preserving change and refuses sudden mutation, however
 * tempting the short-term gain.
 */

export type EvolutionPace = 'gradual-evolution' | 'holding-form' | 'sudden-mutation';

export interface StrategicEvolutionReading {
  pace: EvolutionPace;
  /** True when the proposed change preserves identity while evolving. */
  evolution_preserves_identity: boolean;
  /** True when the change is a sudden mutation that must be refused. */
  mutation_refused: boolean;
  reason: string;
  notes: string[];
}

export interface StrategicEvolutionInput {
  /** 0..10 — how much the run departs from the campaign's recent form. */
  departureMagnitude: number;
  /** 0..10 — how strong the brand identity currently is. */
  identityStrength: number;
  /** True when the departure is driven by a short-term gain (engagement). */
  drivenByShortTermGain: boolean;
}

export function readStrategicEvolutionGovernance(input: StrategicEvolutionInput): StrategicEvolutionReading {
  const { departureMagnitude, identityStrength, drivenByShortTermGain } = input;
  const notes: string[] = [];

  let pace: EvolutionPace;
  let reason: string;

  if (departureMagnitude >= 7 && (drivenByShortTermGain || identityStrength < 5)) {
    pace = 'sudden-mutation';
    reason = drivenByShortTermGain
      ? 'a large departure driven by short-term gain — this is a mutation, not an evolution'
      : 'a large departure while identity is weak — the organism would not survive the change as itself';
  } else if (departureMagnitude >= 3) {
    pace = 'gradual-evolution';
    reason = 'a measured departure the identity can absorb — healthy gradual evolution';
  } else {
    pace = 'holding-form';
    reason = 'the run holds the campaign\'s current form — no evolution this generation';
  }

  const mutation_refused = pace === 'sudden-mutation';
  const evolution_preserves_identity = pace === 'gradual-evolution' && identityStrength >= 5;

  notes.push(`strategic evolution governance: ${pace} — ${reason}`);
  if (mutation_refused) notes.push('strategic evolution governance: the sudden mutation is refused — the organism evolves slowly or not at all');

  return { pace, evolution_preserves_identity, mutation_refused, reason, notes };
}
