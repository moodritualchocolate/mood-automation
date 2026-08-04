/**
 * FEEDBACK BIAS FILTER (Phase 238 — Wave 13: Reality Feedback Infrastructure)
 *
 * The organism reading its own feedback is naturally biased — it
 * wants to find proof of its own decisions. This filter explicitly
 * counterweights that bias.
 */

export type ReadingBias = 'self-flattering' | 'self-critical' | 'balanced';

export interface FeedbackBiasReading {
  detected_bias: ReadingBias;
  /** 0..10 — how much correction is being applied. */
  correction_applied: number;
  bias_note: string;
  notes: string[];
}

export interface FeedbackBiasInput {
  /** True when the organism has been confirming its prior beliefs. */
  confirmingPriorBeliefs: boolean;
  /** True when the organism has been discounting positive feedback. */
  discountingPositive: boolean;
  /** Ratio of positive readings to negative readings. */
  positiveToNegativeRatio: number;
}

export function readFeedbackBiasFilter(input: FeedbackBiasInput): FeedbackBiasReading {
  const { confirmingPriorBeliefs, discountingPositive, positiveToNegativeRatio } = input;
  const notes: string[] = [];

  const detected_bias: ReadingBias =
    confirmingPriorBeliefs && positiveToNegativeRatio >= 2 ? 'self-flattering' :
    discountingPositive ? 'self-critical' : 'balanced';

  let correction_applied = 0;
  if (detected_bias === 'self-flattering') correction_applied = 3;
  else if (detected_bias === 'self-critical') correction_applied = 2;
  correction_applied = round1(correction_applied);

  const bias_note = detected_bias === 'self-flattering'
    ? 'the organism has been reading its own feedback flatteringly — corrected'
    : detected_bias === 'self-critical'
      ? 'the organism has been discounting positive feedback — corrected'
      : 'feedback reading is balanced — no bias correction needed';

  notes.push(`feedback bias filter: ${detected_bias} (correction ${correction_applied}/10) — ${bias_note}`);
  return { detected_bias, correction_applied, bias_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
