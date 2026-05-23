/**
 * STRATEGIC SILENCE TIMING (Phase 269 — Wave 14: Live Civilization Coupling)
 *
 * Silence is itself a deployable instrument. This module decides
 * whether the live moment is one to deploy silence in — and how long.
 */

export interface StrategicSilenceTimingReading {
  /** True when silence is the right deployment this cycle. */
  deploy_silence: boolean;
  /** Number of cycles silence should be held. */
  silence_duration: number;
  silence_reason: string;
  notes: string[];
}

export interface StrategicSilenceTimingInput {
  /** True when the cultural weather is "storm". */
  culturalStorm: boolean;
  /** True when the audience is too stressed to act on. */
  audienceTooStressed: boolean;
  /** True when a delayed meaning is still crystallising. */
  delayedMeaningCrystalising: boolean;
}

export function readStrategicSilenceTiming(input: StrategicSilenceTimingInput): StrategicSilenceTimingReading {
  const { culturalStorm, audienceTooStressed, delayedMeaningCrystalising } = input;
  const notes: string[] = [];

  const deploy_silence = culturalStorm || audienceTooStressed || delayedMeaningCrystalising;

  const silence_duration = culturalStorm ? 3 : audienceTooStressed ? 2 : delayedMeaningCrystalising ? 1 : 0;

  const silence_reason = !deploy_silence
    ? 'no silence — the moment can hold action'
    : culturalStorm
      ? 'cultural storm in progress — hold silence until it passes'
      : audienceTooStressed
        ? 'audience too stressed for action — silence as relief'
        : 'delayed meaning is still crystallising — silence gives it room to land';

  notes.push(`strategic silence timing: ${deploy_silence ? `DEPLOY for ${silence_duration} cycle(s)` : 'no silence'} — ${silence_reason}`);
  return { deploy_silence, silence_duration, silence_reason, notes };
}
