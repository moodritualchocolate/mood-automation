/**
 * MEANING PROPAGATION ENGINE (Phase 402 — Wave 16: Generative Civilization Presence)
 *
 * How meaning spreads outward from the brand without being pushed.
 */

export interface MeaningPropagationReading {
  propagating: boolean;
  propagation_velocity: number;
  notes: string[];
}

export interface MeaningPropagationInput {
  meaningDensity: number;
  trustGravity: number;
}

export function readMeaningPropagationEngine(input: MeaningPropagationInput): MeaningPropagationReading {
  const { meaningDensity, trustGravity } = input;
  const notes: string[] = [];

  const propagation_velocity = round1(Math.min(10, meaningDensity * 0.5 + trustGravity * 0.1));
  const propagating = propagation_velocity >= 5;

  notes.push(`meaning propagation engine: ${propagating ? 'PROPAGATING' : 'still'} (velocity ${propagation_velocity}/10)`);
  return { propagating, propagation_velocity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
