/**
 * STRATEGIC CONVICTION ENGINE (Phase 176 — Wave 11: Strategic Future Intelligence)
 *
 * A strategy reconsidered every cycle is not a strategy. This engine
 * decides when the organism should hold conviction through short-term
 * noise — and when the signal is real enough to genuinely adapt.
 */

import type { FutureScenarioReading } from './futureScenarioSimulation';
import type { MarketTimingReading } from './marketTimingIntelligence';

export interface StrategicConvictionReading {
  /** 0..10 — how much conviction the organism should hold this cycle. */
  conviction_level: number;
  /** True when the organism should hold its line through the noise. */
  hold_conviction: boolean;
  conviction_note: string;
  notes: string[];
}

export interface StrategicConvictionInput {
  /** 0..10 — current identity strength. */
  identityStrength: number;
  scenarios: FutureScenarioReading;
  timing: MarketTimingReading;
}

export function readStrategicConviction(input: StrategicConvictionInput): StrategicConvictionReading {
  const { identityStrength, scenarios, timing } = input;
  const notes: string[] = [];

  let conviction_level = identityStrength * 0.5 + scenarios.expected_future * 0.3 + 2;
  // A genuinely missed window is real signal — it lowers conviction in
  // the current plan and licenses adaptation.
  if (timing.timing === 'missed') conviction_level -= 3;
  conviction_level = round1(Math.max(0, Math.min(10, conviction_level)));

  const hold_conviction = conviction_level >= 6;

  const conviction_note = hold_conviction
    ? 'hold the line — short-term noise is not reason enough to abandon a sound strategy'
    : timing.timing === 'missed'
      ? 'the window was genuinely missed — this is real signal, the plan should adapt'
      : 'conviction is thin — the strategy is not yet sound enough to defend against noise';

  notes.push(`strategic conviction engine: ${conviction_level}/10 — ${conviction_note}`);
  return { conviction_level, hold_conviction, conviction_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
