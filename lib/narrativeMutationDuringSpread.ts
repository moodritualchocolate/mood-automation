/**
 * NARRATIVE MUTATION DURING SPREAD (Phase 280 — Wave 14: Live Civilization Coupling)
 *
 * Catches the narrative mutating as it travels.
 */

export interface NarrativeMutationDuringSpreadReading {
  /** 0..10 — mutation magnitude observed during the spread. */
  mutation_magnitude: number;
  /** True when the narrative is mutating beyond a safe bound. */
  unsafe_mutation: boolean;
  notes: string[];
}

export interface NarrativeMutationDuringSpreadInput {
  memeticIntegrity: number;
  spreadVelocity: number;
}

export function readNarrativeMutationDuringSpread(input: NarrativeMutationDuringSpreadInput): NarrativeMutationDuringSpreadReading {
  const { memeticIntegrity, spreadVelocity } = input;
  const notes: string[] = [];

  const mutation_magnitude = round1(Math.max(0, (10 - memeticIntegrity) * (1 + spreadVelocity / 20)));
  const unsafe_mutation = mutation_magnitude >= 6;

  notes.push(`narrative mutation during spread: ${mutation_magnitude}/10 — ${unsafe_mutation ? 'UNSAFE mutation as it travels' : 'mutation within bounds'}`);
  return { mutation_magnitude, unsafe_mutation, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
