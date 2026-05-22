/**
 * STRATEGIC OPTIONALITY ENGINE (Phase 173 — Wave 11: Strategic Future Intelligence)
 *
 * A strong future position is one with many doors still open. This
 * engine measures the organism's optionality — and warns when an
 * irreversible move or accumulating debt is quietly closing doors.
 */

export interface StrategicOptionalityReading {
  /** 0..10 — how much optionality the organism still holds. */
  optionality: number;
  /** True when the organism is keeping its future options open. */
  optionality_preserved: boolean;
  /** True when options are actively closing. */
  options_closing: boolean;
  notes: string[];
}

export interface StrategicOptionalityInput {
  /** Count of healthy timeline branches still available. */
  healthyBranchCount: number;
  /** 0..10 — how irreversible the current decision is. */
  irreversibility: number;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
}

export function readStrategicOptionality(input: StrategicOptionalityInput): StrategicOptionalityReading {
  const { healthyBranchCount, irreversibility, strategicDebt } = input;
  const notes: string[] = [];

  let optionality = 0;
  optionality += Math.min(6, healthyBranchCount * 3);
  optionality += (10 - irreversibility) * 0.25;
  optionality -= strategicDebt * 0.3;
  optionality = round1(Math.max(0, Math.min(10, optionality)));

  const optionality_preserved = optionality >= 5;
  const options_closing = irreversibility >= 6.5 || (strategicDebt >= 7 && healthyBranchCount <= 1);

  notes.push(`strategic optionality engine: ${optionality}/10 — ` +
    (options_closing ? 'options are closing' : optionality_preserved ? 'options are open' : 'optionality is thin'));
  return { optionality, optionality_preserved, options_closing, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
