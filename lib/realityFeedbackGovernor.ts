/**
 * REALITY FEEDBACK GOVERNOR (Phase 259 — Wave 13: Reality Feedback Infrastructure)
 *
 * The governor of the feedback layer. It reads the key signals —
 * integrity, ecology, contradictions, echo chamber risk — into one
 * judgement: is the organism reality-evolving, learning, in an echo
 * chamber, or blind?
 */

export type FeedbackGovernance = 'reality-evolving' | 'learning' | 'echo-chamber' | 'blind';

export interface RealityFeedbackGovernorReading {
  governance: FeedbackGovernance;
  /** True when the feedback layer is genuinely governing learning. */
  feedback_governed: boolean;
  reason: string;
  notes: string[];
}

export interface RealityFeedbackGovernorInput {
  signalHasIntegrity: boolean;
  ecologySupportsLearning: boolean;
  feedbackCoherent: boolean;
  anyReactionsAtAll: boolean;
  organismIsListeningToOnlyItself: boolean;
}

export function readRealityFeedbackGovernor(input: RealityFeedbackGovernorInput): RealityFeedbackGovernorReading {
  const { signalHasIntegrity, ecologySupportsLearning, feedbackCoherent, anyReactionsAtAll, organismIsListeningToOnlyItself } = input;
  const notes: string[] = [];

  let governance: FeedbackGovernance;
  let reason: string;

  if (organismIsListeningToOnlyItself) {
    governance = 'echo-chamber';
    reason = 'the organism is hearing only its own voice played back — feedback has closed into an echo chamber';
  } else if (!anyReactionsAtAll) {
    governance = 'blind';
    reason = 'no feedback is being received — the organism is acting blind to what its actions become';
  } else if (!signalHasIntegrity || !feedbackCoherent || !ecologySupportsLearning) {
    governance = 'learning';
    reason = !signalHasIntegrity
      ? 'feedback is arriving but its integrity is too low to evolve on'
      : !feedbackCoherent
        ? 'feedback signals are arriving but they contradict each other'
        : 'the feedback ecology cannot yet support real learning';
  } else {
    governance = 'reality-evolving';
    reason = 'integrity, ecology, and coherence all check out — the organism is evolving from what its actions become';
  }

  const feedback_governed = governance === 'reality-evolving' || governance === 'learning';

  notes.push(`reality feedback governor: ${governance} — ${reason}`);
  return { governance, feedback_governed, reason, notes };
}
