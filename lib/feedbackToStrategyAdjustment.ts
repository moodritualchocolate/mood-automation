/**
 * FEEDBACK TO STRATEGY ADJUSTMENT (Phase 241 — Wave 13: Reality Feedback Infrastructure)
 *
 * Sound feedback should change the next strategy. This module
 * proposes the specific adjustment a strategic layer should make
 * based on what reception revealed this cycle.
 */

export interface FeedbackToStrategyReadingW13 {
  /** True when a concrete strategy adjustment is being proposed. */
  adjustment_proposed: boolean;
  adjustment: string;
  /** 0..10 — how strongly the feedback supports the adjustment. */
  adjustment_strength: number;
  notes: string[];
}

export interface FeedbackToStrategyInputW13 {
  /** -10..10 — observed trust shift. */
  trustShift: number;
  /** True when an action under-performed against forecast. */
  underperformed: boolean;
  /** True when audience reactions resembled reflex more than reflection. */
  reflexReactions: boolean;
}

export function readFeedbackToStrategyAdjustment(input: FeedbackToStrategyInputW13): FeedbackToStrategyReadingW13 {
  const { trustShift, underperformed, reflexReactions } = input;
  const notes: string[] = [];

  let adjustment_strength = 0;
  adjustment_strength += Math.abs(trustShift) * 0.6;
  if (underperformed) adjustment_strength += 2;
  if (reflexReactions) adjustment_strength += 1.5;
  adjustment_strength = round1(Math.min(10, adjustment_strength));

  const adjustment_proposed = adjustment_strength >= 3;

  const adjustment = !adjustment_proposed
    ? 'no adjustment — strategy may hold course'
    : trustShift <= -1
      ? 'strategy should slow cadence and re-anchor on truth — feedback shows trust slipping'
      : reflexReactions
        ? 'strategy should pursue deeper resonance — feedback shows shallow, reflex reactions'
        : underperformed
          ? 'strategy should revisit the scenario model — execution missed forecast'
          : 'strategy should consolidate the gain — feedback supports the current course';

  notes.push(`feedback to strategy adjustment: ${adjustment_proposed ? 'ADJUST' : 'hold'} (strength ${adjustment_strength}/10) — ${adjustment}`);
  return { adjustment_proposed, adjustment, adjustment_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
