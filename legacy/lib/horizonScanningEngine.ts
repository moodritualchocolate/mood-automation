/**
 * HORIZON SCANNING ENGINE (Phase 166 — Wave 11: Strategic Future Intelligence)
 *
 * Most of the future announces itself first as a weak signal — small,
 * easy to miss, visible only at the far edge. This engine scans the
 * horizon for those signals and flags an opportunity forming before
 * it becomes obvious.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface HorizonScanReading {
  weak_signals: string[];
  /** 0..10 — how clearly the organism can read its horizon. */
  horizon_clarity: number;
  /** True when a weak signal looks like an opportunity forming. */
  an_opportunity_forming: boolean;
  notes: string[];
}

export interface HorizonScanInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — external signal volume (Wave 10). */
  externalSignalVolume: number;
}

export function scanHorizon(input: HorizonScanInput): HorizonScanReading {
  const { worldState, externalSignalVolume } = input;
  const notes: string[] = [];

  const weak_signals: string[] = [];
  if (worldState.collective_exhaustion >= 6) weak_signals.push('a tiring audience beginning to want quiet over spectacle');
  if (worldState.trust_erosion >= 6) weak_signals.push('eroding trust opening room for a voice that does not perform');
  if (worldState.attention_chaos >= 7) weak_signals.push('attention chaos cresting — a counter-current toward stillness forming beneath it');
  if (worldState.emotional_volatility <= 4 && worldState.collective_exhaustion <= 4) {
    weak_signals.push('a rare calm window where depth can be received');
  }

  const horizon_clarity = round1(Math.min(10, 3 + externalSignalVolume * 0.6 + worldState.observationCount * 0.2));
  const an_opportunity_forming = weak_signals.length > 0 && horizon_clarity >= 4;

  notes.push(`horizon scanning engine: ${weak_signals.length} weak signal(s), clarity ${horizon_clarity}/10` +
    (an_opportunity_forming ? ' — an opportunity is forming at the edge' : ''));
  return { weak_signals, horizon_clarity, an_opportunity_forming, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
