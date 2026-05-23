/**
 * FEEDBACK SIGNAL QUALITY FILTER (Phase 231 — Wave 13: Reality Feedback Infrastructure)
 *
 * Not all incoming feedback is signal — most is noise. This filter
 * separates the two, so the organism only learns from feedback worth
 * learning from.
 */

export interface FeedbackSignalQualityReading {
  /** 0..10 — overall quality of incoming feedback. */
  signal_quality: number;
  /** True when the feedback is clean enough to update beliefs on. */
  signal_is_usable: boolean;
  filter_note: string;
  notes: string[];
}

export interface FeedbackSignalQualityInput {
  /** 0..10 — clarity of incoming reactions. */
  reactionClarity: number;
  /** Number of reactions observed. */
  reactionCount: number;
  /** True when any contradictions were found in the feedback itself. */
  feedbackContradicted: boolean;
}

export function readFeedbackSignalQualityFilter(input: FeedbackSignalQualityInput): FeedbackSignalQualityReading {
  const { reactionClarity, reactionCount, feedbackContradicted } = input;
  const notes: string[] = [];

  let signal_quality = reactionClarity;
  signal_quality += Math.min(2, reactionCount * 0.3);
  if (feedbackContradicted) signal_quality -= 2;
  signal_quality = round1(Math.max(0, Math.min(10, signal_quality)));

  const signal_is_usable = signal_quality >= 5 && reactionCount > 0;

  const filter_note = reactionCount === 0
    ? 'no reactions to filter — no signal this cycle'
    : signal_is_usable
      ? `${reactionCount} reaction(s), clean signal — beliefs may be updated`
      : `${reactionCount} reaction(s) but the signal is too noisy to update on`;

  notes.push(`feedback signal quality filter: ${signal_quality}/10 — ${filter_note}`);
  return { signal_quality, signal_is_usable, filter_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
