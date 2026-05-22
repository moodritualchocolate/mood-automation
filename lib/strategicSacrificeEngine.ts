/**
 * STRATEGIC SACRIFICE ENGINE (Phase 165 — Wave 11: Strategic Future Intelligence)
 *
 * Compounding a future means giving something up now. This engine
 * decides what the organism should sacrifice in the present — reach,
 * speed, a spike of engagement — and whether the trade is worth it.
 */

import type { MarketTimingReading } from './marketTimingIntelligence';

export interface StrategicSacrificeReading {
  sacrifice: string;
  /** True when sacrificing now genuinely buys a better future. */
  sacrifice_is_worth_it: boolean;
  /** 0..10 — the future value the sacrifice would buy. */
  sacrifice_value: number;
  sacrifice_reasoning: string;
  notes: string[];
}

export interface StrategicSacrificeInput {
  /** 0..10 — compounding advantage on the table. */
  compoundingAdvantage: number;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
  timing: MarketTimingReading;
}

export function readStrategicSacrifice(input: StrategicSacrificeInput): StrategicSacrificeReading {
  const { compoundingAdvantage, strategicDebt, timing } = input;
  const notes: string[] = [];

  // The future value of sacrificing present reach.
  let sacrifice_value = 5 + compoundingAdvantage * 0.3 - strategicDebt * 0.2;
  if (timing.timing === 'too-early') sacrifice_value += 2;
  if (timing.timing === 'ripe') sacrifice_value -= 2;
  sacrifice_value = round1(Math.max(0, Math.min(10, sacrifice_value)));

  const sacrifice = timing.timing === 'ripe'
    ? 'nothing — the moment is ripe, this is a time to spend, not sacrifice'
    : 'present reach and the spike of immediate engagement';

  const sacrifice_is_worth_it = sacrifice_value >= 6 && timing.timing !== 'ripe';

  const sacrifice_reasoning = sacrifice_is_worth_it
    ? 'giving up the present spike buys a stronger compounding position — the trade is worth it'
    : timing.timing === 'ripe'
      ? 'this is not a moment to sacrifice — the timing rewards acting'
      : 'the sacrifice would not buy enough future to justify the present cost';

  notes.push(`strategic sacrifice engine: ${sacrifice_is_worth_it ? 'sacrifice IS worth it' : 'do not sacrifice'} ` +
    `(value ${sacrifice_value}/10) — ${sacrifice_reasoning}`);
  return { sacrifice, sacrifice_is_worth_it, sacrifice_value, sacrifice_reasoning, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
