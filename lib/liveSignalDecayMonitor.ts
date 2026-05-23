/**
 * LIVE SIGNAL DECAY MONITOR (Phase 288 — Wave 14: Live Civilization Coupling)
 *
 * Live signals decay as they age. This monitor flags when the
 * signal-set the organism is acting on has gotten too old.
 */

export interface LiveSignalDecayReading {
  /** True when the live signal is fresh enough to act on. */
  signal_is_fresh: boolean;
  /** Cycles since the last live ingestion. */
  cycles_since_ingest: number;
  notes: string[];
}

export interface LiveSignalDecayInput {
  cyclesSinceIngest: number;
}

export function readLiveSignalDecayMonitor(input: LiveSignalDecayInput): LiveSignalDecayReading {
  const { cyclesSinceIngest } = input;
  const notes: string[] = [];

  const signal_is_fresh = cyclesSinceIngest <= 1;

  notes.push(`live signal decay monitor: ${signal_is_fresh ? 'fresh' : 'STALE'} (${cyclesSinceIngest} cycles since last ingest)`);
  return { signal_is_fresh, cycles_since_ingest: cyclesSinceIngest, notes };
}
