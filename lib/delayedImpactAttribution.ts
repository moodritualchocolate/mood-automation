/**
 * DELAYED IMPACT ATTRIBUTION (Phase 227 — Wave 13: Reality Feedback Infrastructure)
 *
 * Some impact arrives cycles after the action that caused it. This
 * module attributes today's observed shift to its actual cause —
 * because crediting the wrong cycle is how organisms learn the wrong
 * lesson.
 */

export interface DelayedImpactReading {
  /** True when today's trust shift was caused by an earlier action, not this cycle. */
  shift_is_delayed: boolean;
  /** Estimated cycles between cause and effect. */
  attribution_lag: number;
  attribution_note: string;
  notes: string[];
}

export interface DelayedImpactInput {
  /** -10..10 — trust shift observed this cycle. */
  thisCycleTrustShift: number;
  /** True when this cycle shipped a banner. */
  thisCycleActed: boolean;
  /** True when an earlier cycle within the last few shipped something. */
  recentPriorAction: boolean;
}

export function readDelayedImpactAttribution(input: DelayedImpactInput): DelayedImpactReading {
  const { thisCycleTrustShift, thisCycleActed, recentPriorAction } = input;
  const notes: string[] = [];

  // A shift that arrives in a silent cycle but follows a prior action
  // is almost certainly a delayed impact of that earlier action.
  const shift_is_delayed = !thisCycleActed && recentPriorAction && Math.abs(thisCycleTrustShift) >= 0.4;
  const attribution_lag = shift_is_delayed ? 2 : 0;

  const attribution_note = shift_is_delayed
    ? `today's trust shift (${thisCycleTrustShift}) lagged ~${attribution_lag} cycles behind an earlier action — credit the earlier cycle`
    : thisCycleActed
      ? 'today\'s shift is attributable to today\'s action'
      : 'no significant delayed shift detected this cycle';

  notes.push(`delayed impact attribution: ${attribution_note}`);
  return { shift_is_delayed, attribution_lag, attribution_note, notes };
}
