/**
 * CRISIS SIGNAL DETECTOR (Phase 301 — Wave 14: Live Civilization Coupling)
 *
 * Detects crisis signals in the live field — moments where action of
 * any kind would be a mistake.
 */

export interface CrisisSignalReading {
  /** True when a crisis signal is active in the field. */
  crisis_active: boolean;
  /** The kind of crisis (or none). */
  crisis_kind: string;
  notes: string[];
}

export interface CrisisSignalInput {
  culturalStorm: boolean;
  audienceAcuteStress: boolean;
  contradictionsActive: boolean;
  counterNarrativeForming: boolean;
}

export function readCrisisSignalDetector(input: CrisisSignalInput): CrisisSignalReading {
  const { culturalStorm, audienceAcuteStress, contradictionsActive, counterNarrativeForming } = input;
  const notes: string[] = [];

  const crisis_active = culturalStorm || audienceAcuteStress || (contradictionsActive && counterNarrativeForming);

  const crisis_kind = !crisis_active ? 'none'
    : culturalStorm ? 'a cultural storm — speech of any kind is shouting into wind'
    : audienceAcuteStress ? 'acute audience stress — adding to it harms'
    : 'a contradiction crisis — the brand and the audience are in a public argument';

  notes.push(`crisis signal detector: ${crisis_active ? `CRISIS — ${crisis_kind}` : 'no crisis'}`);
  return { crisis_active, crisis_kind, notes };
}
