/**
 * MARKET TIMING INTELLIGENCE (Phase 157 — Wave 11: Strategic Future Intelligence)
 *
 * The same move is brilliant or wasted depending on when it is made.
 * This module reads the timing of the moment — too early, ripe,
 * closing, or already missed.
 */

import type { ExecutiveWorldState } from './worldStateEngine';
import type { CulturalShiftReading } from './culturalShiftPrediction';

export type MarketTiming = 'too-early' | 'ripe' | 'closing' | 'missed';

export interface MarketTimingReading {
  timing: MarketTiming;
  /** 0..10 — how well-timed acting now would be. */
  timing_score: number;
  timing_note: string;
  notes: string[];
}

export interface MarketTimingInput {
  worldState: ExecutiveWorldState;
  culturalShift: CulturalShiftReading;
}

export function readMarketTiming(input: MarketTimingInput): MarketTimingReading {
  const { worldState, culturalShift } = input;
  const notes: string[] = [];

  // A ripe moment: the audience has bandwidth and the shift has not
  // yet crested. Too early when the shift is far out; closing/missed
  // when the world is already saturated past it.
  let timing_score = 6;
  timing_score += (10 - worldState.attention_chaos) * 0.2;
  timing_score += (10 - worldState.collective_exhaustion) * 0.2;
  timing_score -= culturalShift.shift_horizon >= 4 ? 2 : 0;
  timing_score -= worldState.digital_overload >= 8 ? 2 : 0;
  timing_score = round1(Math.max(0, Math.min(10, timing_score)));

  const timing: MarketTiming =
    culturalShift.shift_horizon >= 4 ? 'too-early' :
    worldState.digital_overload >= 8 && worldState.attention_chaos >= 8 ? 'missed' :
    timing_score >= 6 ? 'ripe' : 'closing';

  const timing_note =
    timing === 'ripe' ? 'the moment is ripe — acting now lands with the shift'
    : timing === 'too-early' ? 'the moment is early — the cultural shift is still cycles away'
    : timing === 'closing' ? 'the window is closing — act soon or not at all'
    : 'the window has passed — this moment has already been saturated';

  notes.push(`market timing intelligence: ${timing} (${timing_score}/10) — ${timing_note}`);
  return { timing, timing_score, timing_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
