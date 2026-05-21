/**
 * EMOTIONAL SEQUENCE (Phase 9)
 *
 * Prevents emotional flattening across the campaign.
 *
 * HARD RULE the spec names: no two consecutive banners can solve the
 * same emotion. Banner N+1 must evolve away from banner N.
 *
 * This module decides whether the CANDIDATE banner advances the arc
 * or is redundant. Used by:
 *  - the meta-critic, as a hard gate when the candidate would solve
 *    the same emotion as the previous banner
 *  - the Creative Director, as a constraint hint when there is still
 *    room to choose a different state
 */

import type { EmotionalNote, CampaignTimeline } from './campaignTimeline';

export interface SequenceVerdict {
  candidate_note: EmotionalNote;
  /** True when the candidate would advance the campaign meaningfully. */
  advances_arc: boolean;
  /** True when the candidate would solve the same emotion as the
   *  previous banner — the spec's hard NO. */
  redundant_with_previous: boolean;
  /** Optional refinement suggestion. */
  suggested_alternative: EmotionalNote | null;
  notes: string[];
}

export interface SequenceInput {
  timeline: CampaignTimeline;
  /** The note derived from the CANDIDATE banner about to ship. */
  candidate_note: EmotionalNote;
}

export function judgeSequence(input: SequenceInput): SequenceVerdict {
  const { timeline, candidate_note } = input;
  const notes: string[] = [];

  const previous = timeline.entries[timeline.entries.length - 1]?.note ?? null;
  const previousTwo = timeline.last_two_notes;

  // HARD: redundant with previous?
  const redundant_with_previous = previous !== null && previous === candidate_note;
  if (redundant_with_previous) {
    notes.push(`candidate "${candidate_note}" repeats the previous banner — emotional sequence refuses`);
  }

  // Has this note been the dominant in the last 3?
  const dominantInRecent = previousTwo.filter((n) => n === candidate_note).length >= 2;
  if (dominantInRecent) {
    notes.push(`"${candidate_note}" has dominated the last two banners`);
  }

  // Advances the arc?
  // Yes if: candidate is missing from the played notes, OR candidate
  // is the suggested next note from the timeline.
  const isMissing = timeline.notes_missing.includes(candidate_note);
  const matchesSuggestion = timeline.next_note_suggestion === candidate_note;
  const advances_arc = !redundant_with_previous && (isMissing || matchesSuggestion || !dominantInRecent);

  // Alternative suggestion when refused.
  let suggested_alternative: EmotionalNote | null = null;
  if (redundant_with_previous || dominantInRecent) {
    suggested_alternative = timeline.next_note_suggestion ?? (timeline.notes_missing[0] ?? null);
    if (suggested_alternative) notes.push(`suggest evolving toward "${suggested_alternative}"`);
  }

  if (notes.length === 0) notes.push(`"${candidate_note}" advances the arc`);

  return { candidate_note, advances_arc, redundant_with_previous, suggested_alternative, notes };
}
