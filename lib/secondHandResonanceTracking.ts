/**
 * SECOND-HAND RESONANCE TRACKING (Phase 246 — Wave 13: Reality Feedback Infrastructure)
 *
 * The deepest resonance is the kind that reaches people who never saw
 * the original action — they heard it from someone else. This module
 * tracks second-hand resonance — the action carried by other people.
 */

export interface SecondHandResonanceReading {
  /** 0..10 — strength of second-hand resonance. */
  second_hand_resonance: number;
  /** True when the action is genuinely being carried by other people. */
  action_is_being_carried: boolean;
  carry_note: string;
  notes: string[];
}

export interface SecondHandResonanceInput {
  /** Number of word-of-mouth reactions observed. */
  wordOfMouthReactions: number;
  /** 0..10 — meaning persistence. */
  meaningPersistence: number;
  /** 0..10 — average authenticity of incoming reactions. */
  averageAuthenticity: number;
}

export function readSecondHandResonanceTracking(input: SecondHandResonanceInput): SecondHandResonanceReading {
  const { wordOfMouthReactions, meaningPersistence, averageAuthenticity } = input;
  const notes: string[] = [];

  let second_hand_resonance = Math.min(5, wordOfMouthReactions * 0.8);
  second_hand_resonance += meaningPersistence * 0.3;
  second_hand_resonance += averageAuthenticity * 0.2;
  second_hand_resonance = round1(Math.min(10, second_hand_resonance));

  const action_is_being_carried = second_hand_resonance >= 5 && wordOfMouthReactions >= 1;

  const carry_note = action_is_being_carried
    ? 'the action is being carried by other people — second-hand resonance is the deepest kind'
    : 'the action is not being passed on — its life ends with the people who saw it directly';

  notes.push(`second-hand resonance tracking: ${second_hand_resonance}/10 — ${carry_note}`);
  return { second_hand_resonance, action_is_being_carried, carry_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
