/**
 * NARRATIVE CLIMATE MONITOR (Phase 135 — Wave 10: Reality Coupling Architecture)
 *
 * The persistent monitor of the storytelling weather the organism is
 * coupling into. Where Wave 7 detected the climate for a single
 * banner, this module watches it continuously — and reports when the
 * climate has grown so crowded it would reject anything added to it.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export type ExternalNarrativeClimate = 'open' | 'crowded' | 'saturated' | 'hostile';

export interface NarrativeClimateMonitorReading {
  climate: ExternalNarrativeClimate;
  /** 0..10 — how hospitable the climate is to a true, quiet banner. */
  climate_hospitality: number;
  /** True when the climate would reject anything more added to it. */
  climate_rejects_addition: boolean;
  notes: string[];
}

export interface NarrativeClimateMonitorInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — external signal volume (Phase 131). */
  externalSignalVolume: number;
}

export function monitorNarrativeClimate(input: NarrativeClimateMonitorInput): NarrativeClimateMonitorReading {
  const { worldState, externalSignalVolume } = input;
  const notes: string[] = [];

  const noise = (worldState.attention_chaos + worldState.digital_overload + externalSignalVolume) / 3;

  const climate: ExternalNarrativeClimate =
    noise >= 8 ? 'hostile' :
    noise >= 6.5 ? 'saturated' :
    noise >= 5 ? 'crowded' : 'open';

  const climate_hospitality = round1(Math.max(0, Math.min(10, 10 - noise)));
  const climate_rejects_addition = climate === 'saturated' || climate === 'hostile';

  notes.push(`narrative climate monitor: ${climate} (hospitality ${climate_hospitality}/10)` +
    (climate_rejects_addition ? ' — the climate would reject anything more added to it' : ''));
  return { climate, climate_hospitality, climate_rejects_addition, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
