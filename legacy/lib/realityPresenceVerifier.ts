/**
 * REALITY PRESENCE VERIFIER (Phase 306 — Wave 14: Live Civilization Coupling)
 *
 * Verifies that the brand's claim to be present in reality holds up —
 * the boundary between presence and the appearance of presence.
 */

export interface RealityPresenceReading {
  /** True when the brand is verifiably present in reality. */
  is_present: boolean;
  /** 0..10 — verified presence score. */
  presence_score: number;
  presence_note: string;
  notes: string[];
}

export interface RealityPresenceInput {
  presenceMeter: number;
  brandActedThisCycle: boolean;
  liveSignalStrength: number;
}

export function readRealityPresenceVerifier(input: RealityPresenceInput): RealityPresenceReading {
  const { presenceMeter, brandActedThisCycle, liveSignalStrength } = input;
  const notes: string[] = [];

  let presence_score = presenceMeter;
  if (brandActedThisCycle) presence_score += 1;
  presence_score += liveSignalStrength * 0.2;
  presence_score = round1(Math.max(0, Math.min(10, presence_score)));

  const is_present = presence_score >= 5;

  const presence_note = is_present
    ? 'the brand is verifiably present in the live field'
    : 'the brand claims presence but is not verifiably in the field';

  notes.push(`reality presence verifier: ${is_present ? 'PRESENT' : 'NOT PRESENT'} (${presence_score}/10)`);
  return { is_present, presence_score, presence_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
