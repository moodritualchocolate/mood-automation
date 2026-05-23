/**
 * SOVEREIGN VOICE AMPLIFIER (Phase 385 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Amplifies the sovereign voice so it cuts through the noise of the
 * field without raising volume.
 */

export interface SovereignVoiceAmplifierReading {
  /** True when amplification is active. */
  amplified: boolean;
  amplification_strategy: string;
  notes: string[];
}

export interface SovereignVoiceAmplifierInput {
  sovereignty: number;
  noiseLevel: number;
}

export function readSovereignVoiceAmplifier(input: SovereignVoiceAmplifierInput): SovereignVoiceAmplifierReading {
  const { sovereignty, noiseLevel } = input;
  const notes: string[] = [];

  const amplified = sovereignty >= 6 && noiseLevel >= 5;
  const amplification_strategy = amplified
    ? 'amplifying through stillness — let the noise pass, hold the note'
    : 'no amplification needed';

  notes.push(`sovereign voice amplifier: ${amplification_strategy}`);
  return { amplified, amplification_strategy, notes };
}
