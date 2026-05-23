/**
 * FEEDBACK TO STRATEGY BRIDGE (Phase 198 — Wave 12: Autonomous Action Architecture)
 *
 * Execution must inform strategy, not just obey it. This bridge
 * carries what the action layer learned back up to the strategic
 * layer — so the next plan is built on what actually happened.
 */

export interface FeedbackToStrategyReading {
  /** True when execution feedback is being routed back to strategy. */
  feedback_routed: boolean;
  feedback_summary: string;
  /** A concrete adjustment strategy should make next cycle. */
  strategic_adjustment: string;
  notes: string[];
}

export interface FeedbackToStrategyInput {
  /** True when the last action resonated as intended. */
  lastActionResonated: boolean;
  /** True when the audience showed fatigue after recent action. */
  audienceShowedFatigue: boolean;
  /** True when timing predictions have been accurate. */
  timingWasAccurate: boolean;
}

export function readFeedbackToStrategyBridge(input: FeedbackToStrategyInput): FeedbackToStrategyReading {
  const { lastActionResonated, audienceShowedFatigue, timingWasAccurate } = input;
  const notes: string[] = [];

  const feedback_summary = lastActionResonated
    ? 'execution reports the last action resonated as the strategy intended'
    : 'execution reports the last action under-resonated relative to plan';

  const strategic_adjustment =
    audienceShowedFatigue ? 'strategy should widen spacing — execution observed audience fatigue'
    : !lastActionResonated ? 'strategy should revisit the resonance model — execution missed'
    : !timingWasAccurate ? 'strategy should recalibrate timing — execution found the window mispredicted'
    : 'strategy may hold course — execution confirms the plan is landing';

  notes.push(`feedback to strategy bridge: ${feedback_summary} → ${strategic_adjustment}`);
  return { feedback_routed: true, feedback_summary, strategic_adjustment, notes };
}
