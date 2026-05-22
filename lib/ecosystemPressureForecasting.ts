/**
 * ECOSYSTEM PRESSURE FORECASTING (Phase 163 — Wave 11: Strategic Future Intelligence)
 *
 * The organism lives inside an ecosystem — platforms, culture, the
 * attention economy — and that ecosystem tightens or loosens over
 * time. This module forecasts where the ecosystem pressure is going.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface EcosystemPressureReading {
  /** 0..10 — forecast ecosystem pressure a few cycles out. */
  forecast_pressure: number;
  /** True when the ecosystem is tightening around the organism. */
  ecosystem_tightening: boolean;
  dominant_pressure: string;
  notes: string[];
}

export interface EcosystemPressureInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — attention economy pressure (Wave 10). */
  attentionEconomyPressure: number;
}

export function forecastEcosystemPressure(input: EcosystemPressureInput): EcosystemPressureReading {
  const { worldState, attentionEconomyPressure } = input;
  const notes: string[] = [];

  const components: Array<[string, number]> = [
    ['attention economy', attentionEconomyPressure],
    ['digital overload', worldState.digital_overload],
    ['economic pressure', worldState.economic_pressure],
    ['social fragmentation', worldState.social_fragmentation],
  ];
  const current = components.reduce((s, [, v]) => s + v, 0) / components.length;
  // The forecast assumes the ecosystem tightens slightly under chaos.
  const forecast_pressure = round1(Math.min(10, current + worldState.attention_chaos * 0.08));

  const ecosystem_tightening = forecast_pressure >= 6.5;
  const dominant_pressure = [...components].sort((a, b) => b[1] - a[1])[0][0];

  notes.push(`ecosystem pressure forecasting: ${forecast_pressure}/10` +
    (ecosystem_tightening ? ` — TIGHTENING, dominant: ${dominant_pressure}` : ` — dominant: ${dominant_pressure}`));
  return { forecast_pressure, ecosystem_tightening, dominant_pressure, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
