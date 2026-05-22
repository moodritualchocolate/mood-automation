/**
 * STRATEGIC SILENCE INTELLIGENCE (Phase 81 — Wave 7: Reality Organism)
 *
 * The deepest lesson of Wave 7: a healthy organism knows when NOT to
 * act. This module is the organism's intelligence about SILENCE —
 * weighing fatigue, the narrative climate, the rhythm, and the energy
 * budget into one judgement: is silence, here, the stronger move?
 */

export interface StrategicSilenceReading {
  /** 0..10 — how strongly the organism should choose silence. */
  silence_strength: number;
  /** True when silence is the strategically wiser move. */
  choose_silence: boolean;
  /** The case for silence, in one sentence. */
  silence_case: string;
  notes: string[];
}

export interface StrategicSilenceInput {
  /** True when the civilization needs recovery (Phase 80). */
  needsRecovery: boolean;
  /** True when the narrative climate would swallow the banner (Phase 74). */
  climateWouldSwallow: boolean;
  /** True when the organism is out of phase with reality (Phase 77). */
  outOfPhase: boolean;
  /** True when the energy allocation says conserve (Phase 73). */
  mustConserve: boolean;
  /** 0..10 — how strategically worth-it the run is. */
  strategicWeight: number;
}

export function readStrategicSilence(input: StrategicSilenceInput): StrategicSilenceReading {
  const { needsRecovery, climateWouldSwallow, outOfPhase, mustConserve, strategicWeight } = input;
  const notes: string[] = [];

  let silence_strength = 0;
  if (needsRecovery) silence_strength += 3.5;
  if (climateWouldSwallow) silence_strength += 2.5;
  if (outOfPhase) silence_strength += 2;
  if (mustConserve) silence_strength += 3;
  // A genuinely vital run can override mild silence pressure.
  if (strategicWeight >= 8) silence_strength -= 2;
  silence_strength = round1(Math.max(0, Math.min(10, silence_strength)));

  const choose_silence = silence_strength >= 6;

  let silence_case: string;
  if (choose_silence) {
    const reasons: string[] = [];
    if (needsRecovery) reasons.push('the organism needs recovery');
    if (climateWouldSwallow) reasons.push('the climate would swallow the banner');
    if (outOfPhase) reasons.push('the organism is out of phase with reality');
    if (mustConserve) reasons.push('energy must be conserved');
    silence_case = `silence is the stronger move — ${reasons.join('; ')}`;
  } else {
    silence_case = 'silence is not required — the organism can speak';
  }

  notes.push(`strategic silence: strength ${silence_strength}/10 — ${silence_case}`);
  return { silence_strength, choose_silence, silence_case, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
