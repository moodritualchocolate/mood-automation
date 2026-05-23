/**
 * REALTIME CIVILIZATION STATE READOUT (Phase 315 — Wave 14: Live Civilization Coupling)
 *
 * A summary readout of the live civilization state the brand is
 * operating inside of — culture + audience + field, in one glance.
 */

export type CivilizationStateKind = 'open' | 'tense' | 'crisis' | 'aftermath' | 'quiet';

export interface RealtimeCivilizationStateReading {
  state: CivilizationStateKind;
  state_summary: string;
  notes: string[];
}

export interface RealtimeCivilizationStateInput {
  culturalWeather: 'calm' | 'unsettled' | 'storm' | 'aftermath';
  crisisActive: boolean;
  attentionAvailable: number;
}

export function readRealtimeCivilizationStateReadout(input: RealtimeCivilizationStateInput): RealtimeCivilizationStateReading {
  const { culturalWeather, crisisActive, attentionAvailable } = input;
  const notes: string[] = [];

  const state: CivilizationStateKind =
    crisisActive ? 'crisis' :
    culturalWeather === 'storm' ? 'tense' :
    culturalWeather === 'aftermath' ? 'aftermath' :
    attentionAvailable >= 6 ? 'open' : 'quiet';

  const state_summary = `civilization is ${state} (attention ${attentionAvailable}/10 available)`;

  notes.push(`realtime civilization state readout: ${state_summary}`);
  return { state, state_summary, notes };
}
