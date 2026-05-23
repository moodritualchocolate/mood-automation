/**
 * NARRATIVE CONTINUITY ENFORCEMENT (Phase 191 — Wave 12: Autonomous Action Architecture)
 *
 * Wave 11 maps where the narrative is heading. This module enforces
 * it at execution time: an action that breaks the narrative thread —
 * a tonal jump, a contradiction of what came before — is stopped.
 */

export interface NarrativeContinuityReading {
  /** True when the action continues the established narrative. */
  narrative_continuous: boolean;
  /** 0..10 — how large the narrative break would be. */
  continuity_break: number;
  break_description: string;
  notes: string[];
}

export interface NarrativeContinuityInput {
  /** 0..10 — drift of the projected narrative from origin (Wave 11). */
  narrativeDrift: number;
  /** True when the action's voice matches the established voice. */
  voiceConsistent: boolean;
  /** True when the action contradicts an earlier campaign claim. */
  contradictsPriorClaim: boolean;
}

export function readNarrativeContinuityEnforcement(input: NarrativeContinuityInput): NarrativeContinuityReading {
  const { narrativeDrift, voiceConsistent, contradictsPriorClaim } = input;
  const notes: string[] = [];

  let continuity_break = narrativeDrift * 0.4;
  if (!voiceConsistent) continuity_break += 3.5;
  if (contradictsPriorClaim) continuity_break += 4;
  continuity_break = round1(Math.min(10, continuity_break));

  const narrative_continuous = continuity_break < 5;

  const break_description = narrative_continuous
    ? 'the action continues the narrative thread without a visible seam'
    : contradictsPriorClaim
      ? 'the action contradicts an earlier campaign claim — the narrative would visibly break'
      : !voiceConsistent
        ? 'the action speaks in a voice the campaign has not used — a tonal discontinuity'
        : 'the narrative has drifted far enough that this action no longer connects to it';

  notes.push(`narrative continuity enforcement: ${narrative_continuous ? 'continuous' : 'BREAK'} (${continuity_break}/10) — ${break_description}`);
  return { narrative_continuous, continuity_break, break_description, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
