/**
 * REALITY ATTRIBUTION AUDITOR (Phase 257 — Wave 13: Reality Feedback Infrastructure)
 *
 * Claims about what caused what are easy to inflate. This auditor
 * checks the attribution chain: does the credit the organism takes
 * for outcomes actually trace back to the actions it actually took?
 */

export interface RealityAttributionReading {
  /** True when the organism's attribution claims hold up to audit. */
  attribution_holds_up: boolean;
  /** 0..10 — confidence in the attribution. */
  attribution_confidence: number;
  attribution_issue: string | null;
  notes: string[];
}

export interface RealityAttributionInput {
  /** True when a shift was attributed to a recent action. */
  shiftClaimedAsCaused: boolean;
  /** True when a delayed-impact attribution actually applies. */
  isDelayedAttribution: boolean;
  /** True when the world also shifted on its own (proxy: world tension changed). */
  worldShiftedIndependently: boolean;
  /** 0..10 — clarity of signal. */
  reactionClarity: number;
}

export function readRealityAttributionAuditor(input: RealityAttributionInput): RealityAttributionReading {
  const { shiftClaimedAsCaused, isDelayedAttribution, worldShiftedIndependently, reactionClarity } = input;
  const notes: string[] = [];

  let attribution_confidence = reactionClarity * 0.6;
  if (isDelayedAttribution) attribution_confidence += 1;
  if (worldShiftedIndependently) attribution_confidence -= 3;
  attribution_confidence = round1(Math.max(0, Math.min(10, attribution_confidence)));

  const attribution_holds_up = !shiftClaimedAsCaused || attribution_confidence >= 5;

  const attribution_issue = attribution_holds_up
    ? null
    : worldShiftedIndependently
      ? 'the world shifted on its own this cycle — claiming credit for the outcome is unsound'
      : 'the signal is too unclear to attribute the outcome to any specific action';

  notes.push(`reality attribution auditor: ${attribution_holds_up ? 'attribution holds up' : `ATTRIBUTION FAILS — ${attribution_issue}`} (confidence ${attribution_confidence}/10)`);
  return { attribution_holds_up, attribution_confidence, attribution_issue, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
