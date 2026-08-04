/**
 * LIVE FEEDBACK LATENCY (Phase 295 — Wave 14: Live Civilization Coupling)
 *
 * The lag between an action and the live feedback it produces.
 * Short latency = tight coupling; long latency = thinned coupling.
 */

export type FeedbackLatencyKind = 'tight' | 'normal' | 'lagging' | 'severed';

export interface LiveFeedbackLatencyReading {
  latency_kind: FeedbackLatencyKind;
  /** Estimated cycles between action and feedback. */
  latency_cycles: number;
  notes: string[];
}

export interface LiveFeedbackLatencyInput {
  signalIsFresh: boolean;
  liveSignalStrength: number;
}

export function readLiveFeedbackLatency(input: LiveFeedbackLatencyInput): LiveFeedbackLatencyReading {
  const { signalIsFresh, liveSignalStrength } = input;
  const notes: string[] = [];

  const latency_kind: FeedbackLatencyKind =
    liveSignalStrength < 1 ? 'severed' :
    !signalIsFresh ? 'lagging' :
    liveSignalStrength >= 7 ? 'tight' : 'normal';

  const latency_cycles = latency_kind === 'tight' ? 0 : latency_kind === 'normal' ? 1 : latency_kind === 'lagging' ? 2 : 99;

  notes.push(`live feedback latency: ${latency_kind} (~${latency_cycles} cycle(s))`);
  return { latency_kind, latency_cycles, notes };
}
