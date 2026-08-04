/**
 * ENVIRONMENTAL PRESSURE MAPPING (Phase 71 — Wave 7: Reality Organism)
 *
 * Maps the external pressure the organism is living inside — the
 * world's tension, the cultural climate, the economic and attention
 * pressure — into a single environmental load the organism must
 * survive within.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface EnvironmentalPressureReading {
  /** 0..10 — total environmental pressure on the organism. */
  environmental_load: number;
  /** The most acute external pressure. */
  acute_pressure: string;
  /** True when the environment is hostile enough to threaten the organism. */
  environment_is_hostile: boolean;
  notes: string[];
}

export interface EnvironmentalPressureInput {
  worldState: ExecutiveWorldState;
}

export function mapEnvironmentalPressure(input: EnvironmentalPressureInput): EnvironmentalPressureReading {
  const { worldState } = input;
  const notes: string[] = [];

  const components: Array<[string, number]> = [
    ['world tension', worldState.world_tension],
    ['collective exhaustion', worldState.collective_exhaustion],
    ['economic pressure', worldState.economic_pressure],
    ['attention chaos', worldState.attention_chaos],
    ['digital overload', worldState.digital_overload],
  ];
  const environmental_load = round1(components.reduce((s, [, v]) => s + v, 0) / components.length);
  const acute = [...components].sort((a, b) => b[1] - a[1])[0];
  const acute_pressure = `${acute[0]} (${acute[1]}/10)`;
  const environment_is_hostile = environmental_load >= 6.5;

  notes.push(`environmental pressure: load ${environmental_load}/10 — most acute: ${acute_pressure}`);
  if (environment_is_hostile) notes.push('environmental pressure: the environment is hostile — the organism must conserve');

  return { environmental_load, acute_pressure, environment_is_hostile, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
