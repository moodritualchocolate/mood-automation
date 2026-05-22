/**
 * NARRATIVE FUTURE MAPPING (Phase 153 — Wave 11: Strategic Future Intelligence)
 *
 * A campaign narrative is going somewhere whether the organism steers
 * it or not. This module maps where the narrative is heading across
 * the long horizon, and whether that destination is still coherent
 * with where the narrative began.
 */

export interface NarrativeFutureReading {
  narrative_destination: string;
  /** True when the projected narrative still coheres with its origin. */
  narrative_is_coherent: boolean;
  /** 0..10 — how far the projected narrative has drifted from its origin. */
  drift_from_origin: number;
  notes: string[];
}

export interface NarrativeFutureInput {
  /** 0..10 — accumulated trust carried forward. */
  trustCarried: number;
  /** 0..10 — strategic debt accrued. */
  strategicDebt: number;
  /** True when the founding identity is still holding. */
  identityHeld: boolean;
}

export function mapNarrativeFuture(input: NarrativeFutureInput): NarrativeFutureReading {
  const { trustCarried, strategicDebt, identityHeld } = input;
  const notes: string[] = [];

  const drift_from_origin = round1(Math.max(0, Math.min(10,
    strategicDebt * 0.7 + (identityHeld ? 0 : 3) - trustCarried * 0.2)));

  const narrative_is_coherent = drift_from_origin < 5 && identityHeld;

  const narrative_destination = narrative_is_coherent
    ? 'a campaign still recognisably itself — the same quiet voice, deeper'
    : drift_from_origin >= 7
      ? 'a campaign its founders would not recognise — the narrative has wandered off its origin'
      : 'a campaign drifting — the narrative is loosening from where it began';

  notes.push(`narrative future mapping: drift ${drift_from_origin}/10 — heading toward "${narrative_destination}"`);
  return { narrative_destination, narrative_is_coherent, drift_from_origin, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
