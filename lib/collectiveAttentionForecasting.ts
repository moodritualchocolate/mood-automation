/**
 * COLLECTIVE ATTENTION FORECASTING (Phase 78 — Wave 7: Reality Organism)
 *
 * Forecasts where the collective's attention is HEADING — toward more
 * fragmentation, toward fatigue-driven withdrawal, or toward a rare
 * window of depth. The organism positions for the forecast, not the
 * present.
 */

import type { ExecutiveWorldState } from './worldStateEngine';
import type { EmotionalTraceEntry } from './humanMemory';

export type AttentionForecast =
  | 'fragmenting-further'
  | 'withdrawing-into-fatigue'
  | 'holding-steady'
  | 'a-rare-window-of-depth';

export interface CollectiveAttentionForecastReading {
  forecast: AttentionForecast;
  /** 0..10 — confidence in the forecast. */
  forecast_confidence: number;
  /** What the organism should do given the forecast. */
  positioning: string;
  notes: string[];
}

export interface CollectiveAttentionForecastInput {
  worldState: ExecutiveWorldState;
  trail: EmotionalTraceEntry[];
}

export function forecastCollectiveAttention(input: CollectiveAttentionForecastInput): CollectiveAttentionForecastReading {
  const { worldState, trail } = input;
  const notes: string[] = [];

  let forecast: AttentionForecast;
  let positioning: string;

  if (worldState.attention_chaos >= 7 && worldState.digital_overload >= 7) {
    forecast = 'fragmenting-further';
    positioning = 'attention is fragmenting — the organism should hold one quiet, unbreakable note, not compete for the noise';
  } else if (worldState.collective_exhaustion >= 7.5) {
    forecast = 'withdrawing-into-fatigue';
    positioning = 'the collective is withdrawing into fatigue — the organism should speak softly or wait';
  } else if (worldState.world_tension <= 4 && worldState.collective_exhaustion <= 5) {
    forecast = 'a-rare-window-of-depth';
    positioning = 'a rare window where the collective can receive depth — the organism should spend energy here';
  } else {
    forecast = 'holding-steady';
    positioning = 'attention is holding steady — the organism can proceed at its baseline';
  }

  // Confidence rises with a richer world-state observation history.
  const forecast_confidence = round1(Math.min(9,
    3 + Math.min(4, worldState.observationCount / 3) + Math.min(2, trail.length / 8)));

  notes.push(`collective attention forecast: ${forecast} (confidence ${forecast_confidence}/10)`);
  notes.push(`collective attention forecast: positioning — ${positioning}`);

  return { forecast, forecast_confidence, positioning, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
