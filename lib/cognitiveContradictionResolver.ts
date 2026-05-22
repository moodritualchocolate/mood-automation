/**
 * COGNITIVE CONTRADICTION RESOLVER (Phase 26 — Unified Cognitive Field)
 *
 * When the modules disagree, something has to decide. The resolver is
 * that decision — and it decides by a STRICT HIERARCHY, never by
 * aesthetic preference.
 *
 * Decision hierarchy (the spec's, exactly):
 *   1. human truth
 *   2. reality pressure
 *   3. behavioral authenticity
 *   4. cultural honesty
 *   5. campaign atmosphere
 *   6. product / commercial need
 *   7. aesthetic preference
 *
 * Aesthetic preference must NEVER override human truth. The resolver
 * enforces that as a hard rule, not a tendency.
 */

export type ContradictionVoice =
  | 'human-truth'
  | 'reality-pressure'
  | 'behavioral-authenticity'
  | 'cultural-honesty'
  | 'campaign-atmosphere'
  | 'product-commercial'
  | 'aesthetic-preference';

const HIERARCHY: ContradictionVoice[] = [
  'human-truth',
  'reality-pressure',
  'behavioral-authenticity',
  'cultural-honesty',
  'campaign-atmosphere',
  'product-commercial',
  'aesthetic-preference',
];

export interface ModuleVote {
  voice: ContradictionVoice;
  /** What this voice wants the banner to do. */
  position: string;
  /** 0..10 — how strongly this voice is asserting. */
  strength: number;
}

export interface ResolvedContradiction {
  /** The two voices that conflicted. */
  between: [ContradictionVoice, ContradictionVoice];
  winner: ContradictionVoice;
  winning_position: string;
  reason: string;
}

export interface ContradictionResolverReading {
  /** All conflicts the resolver detected. */
  conflicts: ResolvedContradiction[];
  /** The final winning position the banner must obey. */
  governing_position: string;
  /** The voice that governs the final decision. */
  governing_voice: ContradictionVoice;
  /** True when aesthetic preference tried to override human truth. */
  aesthetic_tried_to_override_truth: boolean;
  notes: string[];
}

export interface ContradictionResolverInput {
  votes: ModuleVote[];
}

function rank(voice: ContradictionVoice): number {
  return HIERARCHY.indexOf(voice);
}

export function resolveContradictions(input: ContradictionResolverInput): ContradictionResolverReading {
  const { votes } = input;
  const notes: string[] = [];

  // Only consider voices that are actually asserting (strength > 0).
  const active = votes.filter((v) => v.strength > 0);

  if (active.length === 0) {
    return {
      conflicts: [],
      governing_position: 'no module is asserting a position — banner has no governing decision',
      governing_voice: 'human-truth',
      aesthetic_tried_to_override_truth: false,
      notes: ['contradiction resolver: no active votes'],
    };
  }

  // Detect pairwise conflicts: any two voices both asserting strongly.
  const conflicts: ResolvedContradiction[] = [];
  let aesthetic_tried_to_override_truth = false;

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.voice === b.voice) continue;
      // A conflict is two voices both asserting at strength >= 4.
      if (a.strength >= 4 && b.strength >= 4) {
        const winner = rank(a.voice) < rank(b.voice) ? a : b;
        const loser = winner === a ? b : a;
        if (loser.voice === 'aesthetic-preference' && winner.voice === 'human-truth') {
          // expected — but flag if aesthetic was the STRONGER assertion.
        }
        if (winner.voice !== 'human-truth' && loser.voice === 'human-truth') {
          // never allowed — human truth cannot lose. Force it.
          conflicts.push({
            between: [a.voice, b.voice],
            winner: 'human-truth',
            winning_position: (a.voice === 'human-truth' ? a : b).position,
            reason: 'human truth cannot be overridden — hierarchy rule 1 enforced',
          });
          continue;
        }
        if (winner.voice === 'human-truth' && loser.voice === 'aesthetic-preference' && loser.strength > winner.strength) {
          aesthetic_tried_to_override_truth = true;
        }
        conflicts.push({
          between: [a.voice, b.voice],
          winner: winner.voice,
          winning_position: winner.position,
          reason: `"${winner.voice}" outranks "${loser.voice}" in the decision hierarchy`,
        });
      }
    }
  }

  // The governing voice = the highest-ranked active voice.
  const governing = [...active].sort((x, y) => rank(x.voice) - rank(y.voice))[0];

  notes.push(`contradiction resolver: ${conflicts.length} conflict(s); governing voice "${governing.voice}"`);
  if (aesthetic_tried_to_override_truth) {
    notes.push('WARNING: aesthetic preference asserted harder than human truth — overruled, but flagged');
  }
  for (const c of conflicts) {
    notes.push(`resolved: ${c.between[0]} vs ${c.between[1]} → ${c.winner} (${c.reason})`);
  }

  return {
    conflicts,
    governing_position: governing.position,
    governing_voice: governing.voice,
    aesthetic_tried_to_override_truth,
    notes,
  };
}
