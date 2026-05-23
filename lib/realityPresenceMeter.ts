/**
 * REALITY PRESENCE METER (Phase 292 — Wave 14: Live Civilization Coupling)
 *
 * Measures how present the brand is in reality right now — separate
 * from how much it is talking.
 */

export interface RealityPresenceMeterReading {
  /** 0..10 — how present the brand is in the live moment. */
  presence: number;
  /** True when the brand is genuinely present rather than just speaking. */
  is_present: boolean;
  notes: string[];
}

export interface RealityPresenceMeterInput {
  presenceScore: number;
  meaningGenerated: number;
  liveSignalStrength: number;
}

export function readRealityPresenceMeter(input: RealityPresenceMeterInput): RealityPresenceMeterReading {
  const { presenceScore, meaningGenerated, liveSignalStrength } = input;
  const notes: string[] = [];

  const presence = round1(Math.min(10, presenceScore * 0.5 + Math.min(3, meaningGenerated * 0.4) + liveSignalStrength * 0.2));
  const is_present = presence >= 5;

  notes.push(`reality presence meter: ${presence}/10 — ${is_present ? 'present' : 'not present'}`);
  return { presence, is_present, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
