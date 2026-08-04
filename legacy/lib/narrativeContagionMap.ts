/**
 * NARRATIVE CONTAGION MAP (Phase 266 — Wave 14: Live Civilization Coupling)
 *
 * A narrative spreads like contagion — through nodes, by channels,
 * mutating as it goes. This module maps how the brand's narrative is
 * spreading right now: how far it has reached, how fast, how cleanly.
 */

export type ContagionState = 'spreading' | 'contained' | 'stalled' | 'mutating';

export interface NarrativeContagionMapReading {
  contagion_state: ContagionState;
  /** 0..10 — speed at which the narrative is spreading. */
  spread_velocity: number;
  /** 0..10 — fidelity of the narrative as it spreads. */
  spread_fidelity: number;
  notes: string[];
}

export interface NarrativeContagionMapInput {
  /** 0..10 — second-hand resonance signal (Wave 13). */
  secondHandResonance: number;
  /** 0..10 — memetic integrity score (Wave 13). */
  memeticIntegrity: number;
  /** True when a counter-narrative is forming. */
  counterNarrative: boolean;
}

export function readNarrativeContagionMap(input: NarrativeContagionMapInput): NarrativeContagionMapReading {
  const { secondHandResonance, memeticIntegrity, counterNarrative } = input;
  const notes: string[] = [];

  const spread_velocity = round1(Math.min(10, secondHandResonance * 1.0));
  const spread_fidelity = round1(memeticIntegrity);

  const contagion_state: ContagionState =
    counterNarrative ? 'mutating' :
    spread_velocity >= 6 ? 'spreading' :
    spread_velocity >= 2 ? 'contained' : 'stalled';

  notes.push(`narrative contagion map: ${contagion_state} (velocity ${spread_velocity}/10, fidelity ${spread_fidelity}/10)`);
  return { contagion_state, spread_velocity, spread_fidelity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
