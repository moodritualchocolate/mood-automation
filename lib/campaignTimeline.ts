/**
 * CAMPAIGN TIMELINE (Phase 9)
 *
 * The campaign must know what emotional notes have already played and
 * what notes are missing. Returns a timeline view of the campaign's
 * progression — a director-level read of the SEQUENCE so far.
 *
 * The 9 emotional notes the spec demands the system understands:
 *   disorientation · denial · micro-collapse · ritual ·
 *   quiet control · aftermath · numbness · detachment · recovery
 *
 * Each shipped banner is mapped onto one note (derived from the
 * emotional core + the predicted closing reaction). The timeline
 * then reports:
 *   - notes_already_played    — chronological with counts
 *   - notes_missing           — what the campaign has not yet said
 *   - last_two_notes          — the previous two notes (used by
 *                               sequence to enforce no-repeat)
 *   - next_note_suggestion    — what the sequence engine prefers
 *   - sequenceCoherence       — 0..10, higher = clearer arc
 */

import type { EmotionalTraceEntry } from './humanMemory';

export const EMOTIONAL_NOTES = [
  'disorientation',
  'denial',
  'micro-collapse',
  'ritual',
  'quiet-control',
  'aftermath',
  'numbness',
  'detachment',
  'recovery',
] as const;
export type EmotionalNote = (typeof EMOTIONAL_NOTES)[number];

export interface TimelineEntry {
  bannerId: string;
  note: EmotionalNote;
  ts: number;
  stateLabel: string;
}

export interface CampaignTimeline {
  entries: TimelineEntry[];
  notes_already_played: Array<{ note: EmotionalNote; count: number }>;
  notes_missing: EmotionalNote[];
  last_two_notes: EmotionalNote[];
  next_note_suggestion: EmotionalNote | null;
  sequence_coherence: number;
  /** Plain-text director read of the campaign so far. */
  directorRead: string;
}

export function buildCampaignTimeline(trail: EmotionalTraceEntry[]): CampaignTimeline {
  // Newest first in trail; we want oldest first for the timeline.
  const entries: TimelineEntry[] = trail
    .slice()
    .reverse()
    .map((e) => ({
      bannerId: e.bannerId,
      note: noteForEntry(e),
      ts: e.createdAt,
      stateLabel: e.stateId,
    }));

  const counts = new Map<EmotionalNote, number>();
  for (const e of entries) counts.set(e.note, (counts.get(e.note) ?? 0) + 1);
  const notes_already_played = Array.from(counts.entries())
    .map(([note, count]) => ({ note, count }))
    .sort((a, b) => b.count - a.count);
  const notes_missing = EMOTIONAL_NOTES.filter((n) => !counts.has(n));

  // last_two: take the two most recent entries.
  const last_two_notes = entries.slice(-2).map((e) => e.note);

  // Suggestion: a missing note that "follows" the most recent one along
  // the natural arc the spec named (disorientation → denial → micro-
  // collapse → ritual → quiet-control → aftermath; numbness / detachment
  // / recovery are off-arc resting places).
  const next_note_suggestion = suggestNext(entries, notes_missing);

  // Sequence coherence — higher when the campaign has visited many
  // distinct notes AND has not repeated the last one immediately.
  const variety = Math.min(1, counts.size / 5);
  const repeatPenalty = entries.length >= 2 && entries[entries.length - 1].note === entries[entries.length - 2].note ? 0.4 : 0;
  const sequence_coherence = Math.max(0, Math.min(10, (variety - repeatPenalty) * 10));

  const directorRead = buildDirectorRead(entries, notes_missing, last_two_notes, next_note_suggestion);

  return {
    entries,
    notes_already_played,
    notes_missing,
    last_two_notes,
    next_note_suggestion,
    sequence_coherence,
    directorRead,
  };
}

/**
 * Map an emotional trace entry to one of the 9 notes. Driven by the
 * state family + the predicted closing reaction.
 */
function noteForEntry(e: EmotionalTraceEntry): EmotionalNote {
  const closing = e.reaction.at_3s;
  const family = e.family;

  // Closing reactions are the strongest signal.
  if (closing === 'rejection') return 'denial';
  if (closing === 'indifference') return 'numbness';
  if (closing === 'confusion') return 'disorientation';
  if (closing === 'discomfort') return 'micro-collapse';
  if (closing === 'intimacy' && (family === 'fatigue' || family === 'collapse')) return 'aftermath';
  if (closing === 'intimacy') return 'recovery';
  if (closing === 'validation') return 'quiet-control';
  if (closing === 'recognition' && family === 'numbness') return 'detachment';
  if (closing === 'recognition' && (family === 'fatigue' || family === 'collapse')) return 'ritual';
  if (closing === 'recognition') return 'quiet-control';
  if (closing === 'emotional tension' && family === 'pressure') return 'micro-collapse';
  if (closing === 'emotional tension') return 'ritual';
  if (closing === 'aspiration') return 'recovery';
  if (closing === 'curiosity') return 'disorientation';
  if (closing === 'interruption') return 'disorientation';
  return 'ritual';
}

const ARC_ORDER: EmotionalNote[] = ['disorientation', 'denial', 'micro-collapse', 'ritual', 'quiet-control', 'aftermath'];
const OFF_ARC: EmotionalNote[] = ['numbness', 'detachment', 'recovery'];

function suggestNext(entries: TimelineEntry[], missing: EmotionalNote[]): EmotionalNote | null {
  if (entries.length === 0) return 'disorientation';

  const last = entries[entries.length - 1].note;
  // If we are on the main arc, suggest the next node on the arc that is missing.
  const arcIndex = ARC_ORDER.indexOf(last);
  if (arcIndex >= 0) {
    for (let i = arcIndex + 1; i < ARC_ORDER.length; i++) {
      if (missing.includes(ARC_ORDER[i])) return ARC_ORDER[i];
    }
    // Arc complete — visit an off-arc resting place.
    for (const off of OFF_ARC) if (missing.includes(off)) return off;
  }
  // If we were off-arc, return to the arc — find first missing arc note.
  for (const note of ARC_ORDER) if (missing.includes(note)) return note;
  // Fall back to any missing note.
  if (missing.length > 0) return missing[0];
  // Everything has been said — suggest the least-used.
  const counts = new Map<EmotionalNote, number>();
  for (const e of entries) counts.set(e.note, (counts.get(e.note) ?? 0) + 1);
  const sorted = Array.from(counts.entries()).sort((a, b) => a[1] - b[1]);
  return sorted[0]?.[0] ?? null;
}

function buildDirectorRead(
  entries: TimelineEntry[],
  missing: EmotionalNote[],
  lastTwo: EmotionalNote[],
  next: EmotionalNote | null,
): string {
  if (entries.length === 0) return 'campaign has not opened yet — first banner can choose freely';
  if (entries.length === 1) return `campaign opened on "${entries[0].note}" — next should advance the arc`;
  const parts: string[] = [];
  parts.push(`arc so far: ${entries.map((e) => e.note).slice(-6).join(' → ')}`);
  if (lastTwo.length === 2 && lastTwo[0] === lastTwo[1]) {
    parts.push(`previous two banners both landed on "${lastTwo[0]}" — emotional flattening risk`);
  }
  if (next) parts.push(`director suggests next: "${next}"`);
  if (missing.length > 0 && entries.length >= 4) {
    parts.push(`still unspoken: ${missing.slice(0, 3).join(', ')}`);
  }
  return parts.join(' · ');
}
