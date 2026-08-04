/**
 * AUDIENCE COLLECTIVE PULSE (Phase 296 — Wave 14: Live Civilization Coupling)
 *
 * The unified pulse of the audience as a single body.
 */

export type CollectivePulseState = 'aligned' | 'mixed' | 'fragmented';

export interface AudienceCollectivePulseReading {
  pulse_state: CollectivePulseState;
  /** 0..10 — strength of the collective pulse. */
  pulse_strength: number;
  notes: string[];
}

export interface AudienceCollectivePulseInput {
  pulseIntensity: number;
  fieldVariance: number;
}

export function readAudienceCollectivePulse(input: AudienceCollectivePulseInput): AudienceCollectivePulseReading {
  const { pulseIntensity, fieldVariance } = input;
  const notes: string[] = [];

  const pulse_strength = round1(Math.min(10, pulseIntensity - fieldVariance * 0.3 + 3));
  const pulse_state: CollectivePulseState =
    fieldVariance >= 6 ? 'fragmented' :
    fieldVariance >= 3 ? 'mixed' : 'aligned';

  notes.push(`audience collective pulse: ${pulse_state} (strength ${pulse_strength}/10)`);
  return { pulse_state, pulse_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
