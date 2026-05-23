/**
 * NARRATIVE RECEPTION MAPPING (Phase 244 — Wave 13: Reality Feedback Infrastructure)
 *
 * The story the organism told is only half the story; the story
 * received is the other half. This module maps the received narrative
 * against the intended one, surfacing where the audience heard
 * something different.
 */

export interface NarrativeReceptionReading {
  received_narrative: string;
  /** 0..10 — how closely the received narrative matches the intended. */
  reception_fidelity: number;
  /** True when the audience received roughly the narrative the brand told. */
  narrative_landed_as_intended: boolean;
  notes: string[];
}

export interface NarrativeReceptionInput {
  /** A short description of the intended narrative. */
  intendedNarrative: string;
  /** 0..10 — alignment between intended emotional truth and received. */
  emotionalAlignment: number;
  /** 0..10 — narrative drift observed in reception. */
  receptionDrift: number;
}

export function readNarrativeReceptionMapping(input: NarrativeReceptionInput): NarrativeReceptionReading {
  const { intendedNarrative, emotionalAlignment, receptionDrift } = input;
  const notes: string[] = [];

  const reception_fidelity = round1(Math.max(0, Math.min(10, emotionalAlignment - receptionDrift * 0.5)));
  const narrative_landed_as_intended = reception_fidelity >= 6;

  const received_narrative = narrative_landed_as_intended
    ? intendedNarrative
    : receptionDrift >= 5
      ? `"${intendedNarrative}" — but the audience heard a different story about it`
      : `"${intendedNarrative}" — softened in transmission`;

  notes.push(`narrative reception mapping: fidelity ${reception_fidelity}/10 — ${narrative_landed_as_intended ? 'narrative landed as intended' : 'narrative drifted in reception'}`);
  return { received_narrative, reception_fidelity, narrative_landed_as_intended, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
