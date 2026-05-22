/**
 * LONG-HORIZON PREDICTION ENGINE (Phase 84 — Wave 7: Reality Organism)
 *
 * The organism predicts far ahead — not the next banner, but the
 * coming strategic SEASON. Where is the world heading over many
 * generations, and what must the organism become to still be itself
 * when it arrives?
 */

import type { ExecutiveWorldState } from './worldStateEngine';
import type { OrganismVitalState } from './persistentOrganismCore';

export type StrategicSeason = 'a-season-of-noise' | 'a-season-of-fatigue' | 'a-season-of-searching' | 'a-stable-season';

export interface LongHorizonPredictionReading {
  predicted_season: StrategicSeason;
  /** What the organism must do across the season to remain itself. */
  season_strategy: string;
  /** 0..10 — confidence in the long-horizon prediction. */
  horizon_confidence: number;
  notes: string[];
}

export interface LongHorizonPredictionInput {
  worldState: ExecutiveWorldState;
  organism: OrganismVitalState;
}

export function predictLongHorizon(input: LongHorizonPredictionInput): LongHorizonPredictionReading {
  const { worldState, organism } = input;
  const notes: string[] = [];

  let predicted_season: StrategicSeason;
  let season_strategy: string;

  if (worldState.attention_chaos >= 7 && worldState.digital_overload >= 7) {
    predicted_season = 'a-season-of-noise';
    season_strategy = 'across a season of noise the organism must hold one unbreakable quiet note and refuse to compete for volume';
  } else if (worldState.collective_exhaustion >= 7) {
    predicted_season = 'a-season-of-fatigue';
    season_strategy = 'across a season of fatigue the organism must speak rarely, softly, and only when it has something true';
  } else if (worldState.trust_erosion >= 6 || worldState.emotional_volatility >= 6) {
    predicted_season = 'a-season-of-searching';
    season_strategy = 'across a season of searching the organism must be the steady, honest voice the audience can return to';
  } else {
    predicted_season = 'a-stable-season';
    season_strategy = 'across a stable season the organism can deepen its identity and let the campaign mature';
  }

  const horizon_confidence = round1(Math.min(9,
    3 + Math.min(4, worldState.observationCount / 3) + Math.min(2, organism.age / 8)));

  notes.push(`long-horizon prediction: ${predicted_season} (confidence ${horizon_confidence}/10)`);
  notes.push(`long-horizon prediction: ${season_strategy}`);

  return { predicted_season, season_strategy, horizon_confidence, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
