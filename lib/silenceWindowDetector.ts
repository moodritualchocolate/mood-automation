/**
 * SILENCE WINDOW DETECTOR (Phase 284 — Wave 14: Live Civilization Coupling)
 *
 * Detects windows in the live field where silence would have outsized
 * impact — moments where saying nothing speaks loudest.
 */

export interface SilenceWindowReading {
  /** True when a silence window is open right now. */
  window_open: boolean;
  /** 0..10 — strategic value of holding silence in this window. */
  window_value: number;
  notes: string[];
}

export interface SilenceWindowInput {
  culturalWeather: 'calm' | 'unsettled' | 'storm' | 'aftermath';
  audienceStress: number;
  delayedMeaningStrength: number;
}

export function readSilenceWindowDetector(input: SilenceWindowInput): SilenceWindowReading {
  const { culturalWeather, audienceStress, delayedMeaningStrength } = input;
  const notes: string[] = [];

  let window_value = 0;
  if (culturalWeather === 'storm') window_value += 5;
  if (culturalWeather === 'aftermath') window_value += 3;
  window_value += audienceStress * 0.3;
  window_value += delayedMeaningStrength * 0.4;
  window_value = round1(Math.min(10, window_value));

  const window_open = window_value >= 5;

  notes.push(`silence window detector: ${window_open ? 'OPEN' : 'closed'} (value ${window_value}/10)`);
  return { window_open, window_value, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
