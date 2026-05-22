/**
 * WORLD TENSION INDEX (Phase 42 — World-State Executive Brain / Wave 4)
 *
 * The single composite number for the psychological state of the
 * world the campaign is entering — the weighted sum of every
 * collective, environmental, and social pressure.
 */

import type { CollectivePsychologyReading } from './collectivePsychologyState';
import type { EnvironmentalStressReading } from './environmentalStressMap';
import type { SocialPressureReading } from './socialPressureSystems';

export interface WorldTensionReading {
  /** 0..10 — the composite world tension index. */
  world_tension: number;
  /** The single most acute pressure. */
  most_acute_pressure: string;
  /** True when the world is too tense for an un-aware campaign. */
  world_is_strained: boolean;
  notes: string[];
}

export interface WorldTensionInput {
  collectivePsychology: CollectivePsychologyReading;
  environmental: EnvironmentalStressReading;
  socialPressure: SocialPressureReading;
}

export function readWorldTensionIndex(input: WorldTensionInput): WorldTensionReading {
  const { collectivePsychology, environmental, socialPressure } = input;
  const notes: string[] = [];

  const components: Array<[string, number]> = [
    ['collective exhaustion', collectivePsychology.collective_exhaustion],
    ['anxiety pressure', collectivePsychology.anxiety_pressure],
    ['emotional volatility', collectivePsychology.emotional_volatility],
    ['economic pressure', environmental.economic_pressure],
    ['digital overload', environmental.digital_overload],
    ['social fragmentation', socialPressure.social_fragmentation],
    ['attention chaos', socialPressure.attention_chaos],
    ['loneliness', socialPressure.loneliness_index],
    ['trust erosion', socialPressure.trust_erosion],
  ];

  const world_tension = round1(
    components.reduce((s, [, v]) => s + v, 0) / components.length,
  );

  const most_acute = [...components].sort((a, b) => b[1] - a[1])[0];
  const most_acute_pressure = `${most_acute[0]} (${most_acute[1]}/10)`;
  const world_is_strained = world_tension >= 6;

  notes.push(`world tension index: ${world_tension}/10 — most acute: ${most_acute_pressure}`);
  return { world_tension, most_acute_pressure, world_is_strained, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
