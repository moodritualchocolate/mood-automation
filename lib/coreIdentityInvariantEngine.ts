/**
 * CORE IDENTITY INVARIANT ENGINE (Phase 321 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Defines and verifies the invariants of the brand — the things that
 * must never change, no matter how deeply the organism couples to
 * reality. An invariant violated is identity beginning to dissolve.
 */

export interface CoreInvariant {
  name: string;
  description: string;
  intact: boolean;
}

export interface CoreIdentityInvariantReading {
  invariants: CoreInvariant[];
  /** True when every invariant is intact. */
  all_invariants_intact: boolean;
  /** Names of invariants currently violated. */
  violated_invariant_names: string[];
  /** 0..10 — how intact the invariant set is. */
  invariants_intact_score: number;
  notes: string[];
}

export interface CoreIdentityInvariantInput {
  identityHeld: boolean;
  truthful: boolean;
  notPerformingForReach: boolean;
  notManipulating: boolean;
  voiceConsistent: boolean;
}

export function readCoreIdentityInvariantEngine(input: CoreIdentityInvariantInput): CoreIdentityInvariantReading {
  const { identityHeld, truthful, notPerformingForReach, notManipulating, voiceConsistent } = input;
  const notes: string[] = [];

  const invariants: CoreInvariant[] = [
    { name: 'founding-identity', description: 'the brand holds its founding self', intact: identityHeld },
    { name: 'truth', description: 'the brand tells the truth, even at cost', intact: truthful },
    { name: 'no-performance', description: 'the brand does not perform for reach', intact: notPerformingForReach },
    { name: 'no-manipulation', description: 'the brand does not manipulate', intact: notManipulating },
    { name: 'consistent-voice', description: 'the brand keeps a recognisable voice', intact: voiceConsistent },
  ];

  const violated_invariant_names = invariants.filter((i) => !i.intact).map((i) => i.name);
  const all_invariants_intact = violated_invariant_names.length === 0;
  const invariants_intact_score = round1((invariants.filter((i) => i.intact).length / invariants.length) * 10);

  notes.push(`core identity invariant engine: ${invariants.length - violated_invariant_names.length}/${invariants.length} invariants intact` +
    (violated_invariant_names.length > 0 ? ` — VIOLATED: ${violated_invariant_names.join(', ')}` : ''));
  return { invariants, all_invariants_intact, violated_invariant_names, invariants_intact_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
