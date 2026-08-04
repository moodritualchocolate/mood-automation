/**
 * WORLD-STATE MONITOR VIEW (Phase 117 — Wave 9: Manifestation Architecture)
 *
 * The reality the organism is living inside, surfaced. The persistent
 * world-psychology state — tension, exhaustion, volatility, attention
 * chaos — becomes a live monitor of the weather outside the runtime.
 */

import type { RuntimeSnapshot, Gauge, Tone } from './runtimeUIBrain';

export interface WorldStateMonitorViewModel {
  present: boolean;
  climate: string;
  climate_description: string;
  world_tension: number;
  most_acute_pressure: string;
  pressures: Gauge[];
  observation_count: number;
  statement: string;
}

function tone(v: number): Tone { return v >= 7.5 ? 'bad' : v >= 5.5 ? 'warn' : 'good'; }

export function buildWorldStateMonitorView(snap: RuntimeSnapshot): WorldStateMonitorViewModel {
  const w = snap.worldState;
  if (!w) {
    return {
      present: false, climate: 'unobserved', climate_description: 'the world has not been observed yet',
      world_tension: 0, most_acute_pressure: 'none', pressures: [], observation_count: 0,
      statement: 'no world-state — the runtime has not yet read its reality',
    };
  }

  const pressures: Gauge[] = [
    ['world tension', w.world_tension],
    ['collective exhaustion', w.collective_exhaustion],
    ['emotional volatility', w.emotional_volatility],
    ['attention chaos', w.attention_chaos],
    ['economic pressure', w.economic_pressure],
    ['digital overload', w.digital_overload],
    ['trust erosion', w.trust_erosion],
    ['loneliness index', w.loneliness_index],
  ].map(([label, value]) => ({
    label: label as string,
    value: value as number,
    max: 10,
    display: `${value}/10`,
    tone: tone(value as number),
  }));

  return {
    present: true,
    climate: w.climate,
    climate_description: w.climate_description,
    world_tension: w.world_tension,
    most_acute_pressure: w.most_acute_pressure,
    pressures,
    observation_count: w.observationCount,
    statement: `${w.climate_description} — world tension ${w.world_tension}/10, most acute: ${w.most_acute_pressure}`,
  };
}
