/**
 * CAMPAIGN MUTATION CONTROL (Phase 197 — Wave 12: Autonomous Action Architecture)
 *
 * A campaign evolves — but mutation must be controlled, or the
 * campaign becomes a different campaign without anyone deciding so.
 * This module bounds how far a single action may mutate the whole.
 */

export type MutationVerdict = 'within-bounds' | 'large-mutation' | 'identity-mutation';

export interface CampaignMutationReading {
  mutation_verdict: MutationVerdict;
  /** 0..10 — how far this action mutates the campaign. */
  mutation_magnitude: number;
  /** True when the mutation stays inside controlled bounds. */
  mutation_controlled: boolean;
  notes: string[];
}

export interface CampaignMutationInput {
  /** 0..10 — how much this action departs from the established campaign. */
  departureFromEstablished: number;
  /** True when the action keeps the founding identity. */
  identityKept: boolean;
  /** True when the mutation is a deliberate, decided change. */
  mutationIsDeliberate: boolean;
}

export function readCampaignMutationControl(input: CampaignMutationInput): CampaignMutationReading {
  const { departureFromEstablished, identityKept, mutationIsDeliberate } = input;
  const notes: string[] = [];

  let mutation_magnitude = departureFromEstablished;
  if (!identityKept) mutation_magnitude += 2;
  mutation_magnitude = round1(Math.min(10, mutation_magnitude));

  const mutation_verdict: MutationVerdict =
    !identityKept ? 'identity-mutation' :
    mutation_magnitude >= 6 ? 'large-mutation' :
    'within-bounds';

  // A mutation is controlled when it is small, or when it is large
  // but deliberate — never when it is large and accidental, and never
  // when it mutates identity.
  const mutation_controlled =
    mutation_verdict === 'within-bounds' ||
    (mutation_verdict === 'large-mutation' && mutationIsDeliberate);

  notes.push(`campaign mutation control: ${mutation_verdict} (magnitude ${mutation_magnitude}/10) — ` +
    (mutation_controlled ? 'mutation is controlled' : 'MUTATION UNCONTROLLED'));
  return { mutation_verdict, mutation_magnitude, mutation_controlled, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
