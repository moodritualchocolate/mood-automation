/**
 * STRATEGIC CONFLICT RESOLUTION (Phase 41 — Executive Decision Runtime / Wave 4)
 *
 * The Phase 36–42 layers will disagree: strategy wants to proceed,
 * energy wants silence, timing wants delay, governance wants to
 * archive. The resolver decides — by a strict executive hierarchy.
 *
 * Hierarchy (highest wins):
 *   1. identity governance   — never violate the brand's constitution
 *   2. world understanding   — never enter a world blind
 *   3. truth + cognitive energy — never speak emptily
 *   4. temporal fitness      — never speak at the wrong moment
 *   5. strategic priority    — spend energy where it matters
 *   6. lifecycle / continuity — keep the campaign coherent
 */

export type ConflictVoice =
  | 'identity-governance'
  | 'world-understanding'
  | 'cognitive-energy'
  | 'temporal-fitness'
  | 'strategic-priority'
  | 'lifecycle-continuity';

const HIERARCHY: ConflictVoice[] = [
  'identity-governance',
  'world-understanding',
  'cognitive-energy',
  'temporal-fitness',
  'strategic-priority',
  'lifecycle-continuity',
];

export interface ConflictPosition {
  voice: ConflictVoice;
  /** True when this voice wants to BLOCK the output. */
  wants_block: boolean;
  /** The action this voice is pushing toward. */
  pushes_toward: string;
  reason: string;
}

export interface StrategicConflictReading {
  conflicts: Array<{ between: [ConflictVoice, ConflictVoice]; winner: ConflictVoice }>;
  /** The governing voice — the highest-ranked one that is asserting. */
  governing_voice: ConflictVoice;
  /** True when the governing voice wants to block the output. */
  governing_blocks: boolean;
  governing_reason: string;
  notes: string[];
}

export interface StrategicConflictInput {
  positions: ConflictPosition[];
}

function rank(v: ConflictVoice): number { return HIERARCHY.indexOf(v); }

export function resolveStrategicConflict(input: StrategicConflictInput): StrategicConflictReading {
  const { positions } = input;
  const notes: string[] = [];

  const blockers = positions.filter((p) => p.wants_block);
  const conflicts: StrategicConflictReading['conflicts'] = [];

  // A conflict exists wherever one voice blocks and another does not.
  for (const b of blockers) {
    for (const p of positions) {
      if (!p.wants_block && p.voice !== b.voice) {
        const winner = rank(b.voice) <= rank(p.voice) ? b.voice : p.voice;
        conflicts.push({ between: [b.voice, p.voice], winner });
      }
    }
  }

  // The governing voice — highest-ranked voice present. If any blocker
  // outranks every non-blocker, the output is blocked.
  const sorted = [...positions].sort((a, b) => rank(a.voice) - rank(b.voice));
  const governing = sorted[0];
  const governing_voice = governing.voice;
  const governing_blocks = governing.wants_block;
  const governing_reason = governing.reason;

  notes.push(`strategic conflict resolution: governing voice "${governing_voice}" — ${governing_blocks ? 'BLOCKS' : 'permits'} the output`);
  for (const c of conflicts) {
    notes.push(`conflict: ${c.between[0]} vs ${c.between[1]} → ${c.winner}`);
  }

  return { conflicts, governing_voice, governing_blocks, governing_reason, notes };
}
