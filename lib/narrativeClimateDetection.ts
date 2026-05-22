/**
 * NARRATIVE CLIMATE DETECTION (Phase 74 — Wave 7: Reality Organism)
 *
 * Reads the storytelling weather the organism is about to speak into —
 * whether the narrative climate is hospitable to a quiet true banner
 * or saturated, hostile, and likely to swallow it.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export type NarrativeClimate = 'open' | 'crowded' | 'saturated' | 'hostile';

export interface NarrativeClimateReading {
  climate: NarrativeClimate;
  /** 0..10 — how hospitable the climate is to a true, quiet banner. */
  hospitability: number;
  /** True when the climate would swallow the banner. */
  climate_would_swallow_it: boolean;
  notes: string[];
}

export interface NarrativeClimateInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — cultural / viral acceleration. */
  viralContamination: number;
}

export function detectNarrativeClimate(input: NarrativeClimateInput): NarrativeClimateReading {
  const { worldState, viralContamination } = input;
  const notes: string[] = [];

  const noise = (worldState.attention_chaos + worldState.digital_overload + viralContamination) / 3;

  let climate: NarrativeClimate;
  if (noise >= 8) climate = 'hostile';
  else if (noise >= 6.5) climate = 'saturated';
  else if (noise >= 5) climate = 'crowded';
  else climate = 'open';

  const hospitability = round1(Math.max(0, Math.min(10, 10 - noise)));
  const climate_would_swallow_it = climate === 'hostile' || climate === 'saturated';

  notes.push(`narrative climate: ${climate} (hospitability ${hospitability}/10, narrative noise ${round1(noise)}/10)`);
  if (climate_would_swallow_it) notes.push('narrative climate: the climate would swallow a quiet banner — the organism may do better to wait');

  return { climate, hospitability, climate_would_swallow_it, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
