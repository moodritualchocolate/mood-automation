/**
 * FALSE SUCCESS DETECTOR (Phase 251 — Wave 13: Reality Feedback Infrastructure)
 *
 * Some metrics look like success but aren't — the loud applause that
 * never returned, the burst of engagement that cost trust. This
 * detector flags the kinds of "success" that are actually subtraction.
 */

export interface FalseSuccessReading {
  /** True when this cycle's apparent success is false. */
  false_success_detected: boolean;
  /** The kind of false success. */
  false_success_kind: string;
  /** True when the false success is being charged to the trust account. */
  trust_is_paying_for_it: boolean;
  notes: string[];
}

export interface FalseSuccessInput {
  /** 0..10 — apparent engagement (immediate metric). */
  apparentEngagement: number;
  /** -10..10 — actual trust shift. */
  actualTrustShift: number;
  /** True when the cycle ran on stimulus rather than resonance. */
  ranOnStimulus: boolean;
  /** True when reactions were primarily reflexive. */
  reflexReactions: boolean;
}

export function readFalseSuccessDetector(input: FalseSuccessInput): FalseSuccessReading {
  const { apparentEngagement, actualTrustShift, ranOnStimulus, reflexReactions } = input;
  const notes: string[] = [];

  const false_success_detected = apparentEngagement >= 7 && actualTrustShift <= -0.2;
  const trust_is_paying_for_it = false_success_detected;

  const false_success_kind = !false_success_detected
    ? 'none — apparent success matches actual outcome'
    : ranOnStimulus
      ? 'a stimulus high — large immediate engagement bought by spending trust'
      : reflexReactions
        ? 'a reflex spike — fast reactions that did not carry meaning'
        : 'an applause/recognition mismatch — loud now, costly later';

  notes.push(`false success detector: ${false_success_detected ? 'FALSE SUCCESS' : 'no false success'} — ${false_success_kind}`);
  return { false_success_detected, false_success_kind, trust_is_paying_for_it, notes };
}
