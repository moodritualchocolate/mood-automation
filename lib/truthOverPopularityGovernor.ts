/**
 * TRUTH OVER POPULARITY GOVERNOR (Phase 324 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The hardest sovereign choice: when the truthful action would be
 * unpopular, and the popular action would be untrue. This governor
 * routes the choice to truth — and logs how often it has held.
 */

export interface TruthOverPopularityReading {
  /** True when the brand chose truth over popularity this cycle. */
  chose_truth: boolean;
  /** -10..10 — net direction of the choice. */
  choice_direction: number;
  choice_note: string;
  notes: string[];
}

export interface TruthOverPopularityInput {
  truthfulOptionAvailable: boolean;
  popularOptionAvailable: boolean;
  truthfulOptionLessPopular: boolean;
  /** What the run actually picked. */
  pickedTruthful: boolean;
}

export function readTruthOverPopularityGovernor(input: TruthOverPopularityInput): TruthOverPopularityReading {
  const { truthfulOptionAvailable, popularOptionAvailable, truthfulOptionLessPopular, pickedTruthful } = input;
  const notes: string[] = [];

  // Only meaningful when there is a real tradeoff present.
  const realTradeoff = truthfulOptionAvailable && popularOptionAvailable && truthfulOptionLessPopular;
  const chose_truth = !realTradeoff || pickedTruthful;
  const choice_direction = realTradeoff ? (pickedTruthful ? 5 : -5) : 0;

  const choice_note = !realTradeoff
    ? 'no truth-vs-popularity tradeoff this cycle'
    : pickedTruthful
      ? 'truth was chosen over popularity — the brand paid the cost'
      : 'popularity was chosen over truth — the brand was captured by approval';

  notes.push(`truth over popularity governor: ${chose_truth ? 'TRUTH HELD' : 'TRUTH ABANDONED'} — ${choice_note}`);
  return { chose_truth, choice_direction, choice_note, notes };
}
