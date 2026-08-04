/**
 * POPULIST TEMPTATION GAUGE (Phase 354 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Gauges the temptation to take the popular-but-untrue path.
 */

export interface PopulistTemptationGaugeReading {
  /** 0..10 — strength of populist temptation right now. */
  temptation_strength: number;
  /** True when temptation is high enough to require active resistance. */
  resistance_required: boolean;
  notes: string[];
}

export interface PopulistTemptationGaugeInput {
  popularPathPresent: boolean;
  popularPathUntrue: boolean;
  costOfTruth: number;
}

export function readPopulistTemptationGauge(input: PopulistTemptationGaugeInput): PopulistTemptationGaugeReading {
  const { popularPathPresent, popularPathUntrue, costOfTruth } = input;
  const notes: string[] = [];

  let temptation_strength = 0;
  if (popularPathPresent && popularPathUntrue) temptation_strength = 4 + costOfTruth * 0.6;
  temptation_strength = round1(Math.min(10, temptation_strength));

  const resistance_required = temptation_strength >= 5;

  notes.push(`populist temptation gauge: ${temptation_strength}/10 — ${resistance_required ? 'RESIST' : 'no temptation'}`);
  return { temptation_strength, resistance_required, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
