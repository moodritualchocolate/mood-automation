/**
 * LIVE SIGNAL AGGREGATOR (Phase 287 — Wave 14: Live Civilization Coupling)
 *
 * Aggregates the live signals into one unified live readout.
 */

export interface LiveSignalAggregatorReading {
  /** 0..10 — total live signal strength. */
  live_signal_strength: number;
  /** True when enough live signal exists to drive decisions. */
  enough_signal: boolean;
  notes: string[];
}

export interface LiveSignalAggregatorInput {
  streamVolume: number;
  liveValence: number;
  pulseIntensity: number;
}

export function readLiveSignalAggregator(input: LiveSignalAggregatorInput): LiveSignalAggregatorReading {
  const { streamVolume, liveValence, pulseIntensity } = input;
  const notes: string[] = [];

  const live_signal_strength = round1(Math.min(10, streamVolume * 0.4 + Math.abs(liveValence) * 0.3 + pulseIntensity * 0.3));
  const enough_signal = live_signal_strength >= 4;

  notes.push(`live signal aggregator: ${live_signal_strength}/10 — ${enough_signal ? 'enough' : 'too thin'}`);
  return { live_signal_strength, enough_signal, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
