/**
 * EMOTIONAL ECHO TRACKER (Phase 232 — Wave 13: Reality Feedback Infrastructure)
 *
 * A true action does not just land — it echoes. This module tracks
 * the echo: the audience-side feeling that keeps reverberating across
 * cycles after the action ended.
 */

export interface EmotionalEchoReading {
  /** 0..10 — magnitude of the emotional echo still audible. */
  echo_magnitude: number;
  /** Estimated cycles the echo has been audible. */
  echo_cycles: number;
  /** True when the echo is the kind that compounds the brand. */
  echo_is_compounding: boolean;
  notes: string[];
}

export interface EmotionalEchoInput {
  /** 0..10 — meaning persistence score from feedback state. */
  meaningPersistence: number;
  /** 0..10 — resonance carried by recent actions. */
  recentResonance: number;
  /** Cycles since the last action shipped. */
  cyclesSinceAction: number;
}

export function readEmotionalEchoTracker(input: EmotionalEchoInput): EmotionalEchoReading {
  const { meaningPersistence, recentResonance, cyclesSinceAction } = input;
  const notes: string[] = [];

  let echo_magnitude = meaningPersistence * 0.5 + recentResonance * 0.4;
  echo_magnitude -= Math.max(0, cyclesSinceAction - 2) * 0.6;
  echo_magnitude = round1(Math.max(0, Math.min(10, echo_magnitude)));

  const echo_cycles = Math.max(0, Math.min(8, cyclesSinceAction + (echo_magnitude >= 4 ? 1 : 0)));
  const echo_is_compounding = echo_magnitude >= 5 && cyclesSinceAction >= 1;

  notes.push(`emotional echo tracker: magnitude ${echo_magnitude}/10 across ~${echo_cycles} cycles` +
    (echo_is_compounding ? ' — the action is still working' : ''));
  return { echo_magnitude, echo_cycles, echo_is_compounding, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
