/**
 * TEMPORAL ARBITRAGE DETECTOR (Phase 177 — Wave 11: Strategic Future Intelligence)
 *
 * The rarest strategic find: an asymmetric opportunity in time — a
 * window where acting now, before the field notices, compounds far
 * more than it would once the window is obvious.
 */

import type { MarketTimingReading } from './marketTimingIntelligence';
import type { HorizonScanReading } from './horizonScanningEngine';

export interface TemporalArbitrageReading {
  /** 0..10 — the size of the time-asymmetric opportunity. */
  arbitrage_window: number;
  /** True when there is a genuine asymmetric opportunity in time. */
  asymmetric_opportunity: boolean;
  window_note: string;
  notes: string[];
}

export interface TemporalArbitrageInput {
  timing: MarketTimingReading;
  horizon: HorizonScanReading;
  /** 0..10 — competitive pressure (Phase 162). */
  competitivePressure: number;
}

export function detectTemporalArbitrage(input: TemporalArbitrageInput): TemporalArbitrageReading {
  const { timing, horizon, competitivePressure } = input;
  const notes: string[] = [];

  // The asymmetry: a forming opportunity, a ripe-or-early window, and
  // a field not yet crowding the same space.
  let arbitrage_window = 0;
  if (horizon.an_opportunity_forming) arbitrage_window += 4;
  if (timing.timing === 'ripe') arbitrage_window += 3;
  if (timing.timing === 'too-early') arbitrage_window += 2;
  arbitrage_window += Math.max(0, (6 - competitivePressure) * 0.5);
  arbitrage_window = round1(Math.max(0, Math.min(10, arbitrage_window)));

  const asymmetric_opportunity = arbitrage_window >= 6;

  const window_note = asymmetric_opportunity
    ? `an asymmetric window is open — acting before the field notices compounds far more than acting late`
    : 'no temporal arbitrage — there is no asymmetric advantage in acting now versus later';

  notes.push(`temporal arbitrage detector: window ${arbitrage_window}/10 — ${window_note}`);
  return { arbitrage_window, asymmetric_opportunity, window_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
