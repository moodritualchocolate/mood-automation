/**
 * MEMETIC INTEGRITY TRACKING (Phase 229 — Wave 13: Reality Feedback Infrastructure)
 *
 * A message mutates as it spreads. This module tracks whether the
 * meme — the meaning that travels — is keeping its integrity, or
 * whether the world is reshaping it into something the brand never
 * said.
 */

export type MemeticIntegrity = 'intact' | 'softened' | 'distorted' | 'inverted';

export interface MemeticIntegrityReading {
  integrity_state: MemeticIntegrity;
  /** 0..10 — how intact the meaning has stayed as it spreads. */
  integrity_score: number;
  /** True when the meaning is being distorted as it travels. */
  meaning_is_distorting: boolean;
  notes: string[];
}

export interface MemeticIntegrityInput {
  /** 0..10 — alignment between intended and received valence. */
  emotionalAlignment: number;
  /** 0..10 — narrative drift observed in reception. */
  receptionDrift: number;
  /** True when an active counter-narrative is forming. */
  counterNarrativeForming: boolean;
}

export function readMemeticIntegrityTracking(input: MemeticIntegrityInput): MemeticIntegrityReading {
  const { emotionalAlignment, receptionDrift, counterNarrativeForming } = input;
  const notes: string[] = [];

  let integrity_score = emotionalAlignment - receptionDrift * 0.5;
  if (counterNarrativeForming) integrity_score -= 3;
  integrity_score = round1(Math.max(0, Math.min(10, integrity_score)));

  const integrity_state: MemeticIntegrity =
    counterNarrativeForming && integrity_score < 4 ? 'inverted' :
    integrity_score < 4 ? 'distorted' :
    integrity_score < 7 ? 'softened' : 'intact';

  const meaning_is_distorting = integrity_state === 'distorted' || integrity_state === 'inverted';

  notes.push(`memetic integrity tracking: ${integrity_state} (${integrity_score}/10) — ` +
    (meaning_is_distorting ? 'the meaning is being reshaped as it travels' : 'the meaning is holding'));
  return { integrity_state, integrity_score, meaning_is_distorting, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
