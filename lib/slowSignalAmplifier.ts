/**
 * SLOW SIGNAL AMPLIFIER (Phase 281 — Wave 14: Live Civilization Coupling)
 *
 * Slow signals are usually too quiet to drive a decision. This module
 * deliberately amplifies them so they are heard above the fast noise.
 */

export interface SlowSignalAmplifierReading {
  /** True when a slow signal was amplified to action-bearing level. */
  amplified: boolean;
  amplified_signal: string | null;
  notes: string[];
}

export interface SlowSignalAmplifierInput {
  slowTruthDetected: boolean;
  delayedMeaningRecognised: boolean;
  fastNoiseLevel: number;
}

export function readSlowSignalAmplifier(input: SlowSignalAmplifierInput): SlowSignalAmplifierReading {
  const { slowTruthDetected, delayedMeaningRecognised, fastNoiseLevel } = input;
  const notes: string[] = [];

  const amplified = slowTruthDetected || delayedMeaningRecognised;

  const amplified_signal = !amplified ? null
    : fastNoiseLevel >= 7
      ? 'the slow signal is real — amplifying so it is heard above the noise'
      : 'the slow signal is real and the field is quiet enough to hear it without amplification';

  notes.push(`slow signal amplifier: ${amplified ? `AMPLIFIED — "${amplified_signal}"` : 'no slow signal to amplify'}`);
  return { amplified, amplified_signal, notes };
}
