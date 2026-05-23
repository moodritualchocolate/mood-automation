/**
 * MEANING DENSITY ANALYZER (Phase 283 — Wave 14: Live Civilization Coupling)
 *
 * How dense the meaning of the current action is — meaning per unit
 * of attention demanded.
 */

export type MeaningDensity = 'high' | 'moderate' | 'thin';

export interface MeaningDensityReading {
  density: MeaningDensity;
  /** 0..10 — meaning density of the run. */
  density_score: number;
  notes: string[];
}

export interface MeaningDensityInput {
  resonance: number;
  truthfulness: boolean;
  attentionDemanded: number;
}

export function readMeaningDensityAnalyzer(input: MeaningDensityInput): MeaningDensityReading {
  const { resonance, truthfulness, attentionDemanded } = input;
  const notes: string[] = [];

  const numerator = resonance + (truthfulness ? 2 : 0);
  const density_score = round1(Math.max(0, Math.min(10, numerator * 10 / Math.max(1, attentionDemanded + 4))));

  const density: MeaningDensity =
    density_score >= 7 ? 'high' : density_score >= 4 ? 'moderate' : 'thin';

  notes.push(`meaning density analyzer: ${density} (${density_score}/10)`);
  return { density, density_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
