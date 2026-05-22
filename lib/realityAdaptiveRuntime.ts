/**
 * REALITY-ADAPTIVE RUNTIME (Phase 87 — Wave 7: Reality Organism)
 *
 * The runtime that lets the organism ADAPT to reality continuously
 * rather than execute a fixed program. It synthesises the Wave 7
 * environmental and rhythm readings into one adaptive posture: how
 * the organism should hold itself given the reality it is in.
 */

import type { EnvironmentalPressureReading } from './environmentalPressureMapping';
import type { RealityRhythmReading } from './realityRhythmSynchronization';
import type { AdaptiveWorldStateReading } from './adaptiveWorldStateModeling';
import type { NarrativeClimateReading } from './narrativeClimateDetection';

export type AdaptivePosture =
  | 'engage-fully'
  | 'engage-carefully'
  | 'observe-and-wait'
  | 'withdraw-and-conserve';

export interface RealityAdaptiveRuntimeReading {
  posture: AdaptivePosture;
  /** 0..10 — how well-adapted the organism is to its current reality. */
  adaptation_quality: number;
  /** True when the organism is reacting compulsively rather than adapting. */
  reacting_not_adapting: boolean;
  reason: string;
  notes: string[];
}

export interface RealityAdaptiveRuntimeInput {
  environmental: EnvironmentalPressureReading;
  rhythm: RealityRhythmReading;
  worldModel: AdaptiveWorldStateReading;
  climate: NarrativeClimateReading;
  /** True when the run is being pushed by stimulation / engagement pressure. */
  stimulationDriven: boolean;
}

export function readRealityAdaptiveRuntime(input: RealityAdaptiveRuntimeInput): RealityAdaptiveRuntimeReading {
  const { environmental, rhythm, worldModel, climate, stimulationDriven } = input;
  const notes: string[] = [];

  let posture: AdaptivePosture;
  let reason: string;

  if (environmental.environment_is_hostile && climate.climate_would_swallow_it) {
    posture = 'withdraw-and-conserve';
    reason = 'the environment is hostile and the climate would swallow the banner — withdraw and conserve';
  } else if (worldModel.model_lagging || rhythm.phase === 'out-of-phase') {
    posture = 'observe-and-wait';
    reason = worldModel.model_lagging
      ? 'the organism\'s model lags a fast-shifting reality — observe before acting'
      : 'the organism is out of phase with reality\'s rhythm — wait for the beat';
  } else if (rhythm.phase === 'in-sync' && !environmental.environment_is_hostile) {
    posture = 'engage-fully';
    reason = 'the organism is in sync with a manageable reality — engage fully';
  } else {
    posture = 'engage-carefully';
    reason = 'reality is workable but not ideal — engage carefully';
  }

  // Adaptation quality — high when the posture genuinely fits reality.
  let adaptation_quality = 0;
  adaptation_quality += rhythm.synchronization * 0.4;
  adaptation_quality += worldModel.model_fidelity * 0.35;
  adaptation_quality += (10 - environmental.environmental_load) * 0.25;
  adaptation_quality = round1(Math.max(0, Math.min(10, adaptation_quality)));

  // Reacting, not adapting — the organism wants to engage fully while
  // stimulation drives it and reality does not actually support it.
  const reacting_not_adapting =
    stimulationDriven && posture === 'engage-fully' && adaptation_quality < 6;

  notes.push(`reality-adaptive runtime: ${posture} (adaptation quality ${adaptation_quality}/10) — ${reason}`);
  if (reacting_not_adapting) notes.push('reality-adaptive runtime: the organism is reacting to stimulation, not adapting to reality');

  return { posture, adaptation_quality, reacting_not_adapting, reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
