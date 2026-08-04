/**
 * CORE BELIEF INTEGRITY VALIDATOR (Phase 348 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Validates that the brand's stated core beliefs still match its
 * behavior.
 */

export interface CoreBeliefIntegrityReading {
  beliefs_align_with_actions: boolean;
  /** 0..10 — alignment. */
  alignment: number;
  notes: string[];
}

export interface CoreBeliefIntegrityInput {
  statedBeliefs: number;     // count of stated beliefs
  contradictedThisCycle: number;
}

export function readCoreBeliefIntegrityValidator(input: CoreBeliefIntegrityInput): CoreBeliefIntegrityReading {
  const { statedBeliefs, contradictedThisCycle } = input;
  const notes: string[] = [];

  const alignment = round1(statedBeliefs > 0 ? Math.max(0, (statedBeliefs - contradictedThisCycle) / statedBeliefs * 10) : 10);
  const beliefs_align_with_actions = contradictedThisCycle === 0;

  notes.push(`core belief integrity validator: ${alignment}/10 — ${beliefs_align_with_actions ? 'aligned' : 'CONTRADICTED'}`);
  return { beliefs_align_with_actions, alignment, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
