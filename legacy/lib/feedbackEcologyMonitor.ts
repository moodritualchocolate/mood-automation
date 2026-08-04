/**
 * FEEDBACK ECOLOGY MONITOR (Phase 255 — Wave 13: Reality Feedback Infrastructure)
 *
 * Feedback does not arrive in isolation — it arrives as an ecology of
 * signals interacting with each other. This monitor reads the ecology
 * as a whole: whether the feedback environment is healthy enough to
 * trust.
 */

export type FeedbackEcology = 'healthy' | 'thin' | 'polluted' | 'collapsed';

export interface FeedbackEcologyReading {
  ecology_state: FeedbackEcology;
  /** True when the feedback ecology supports honest learning. */
  ecology_supports_learning: boolean;
  ecology_note: string;
  notes: string[];
}

export interface FeedbackEcologyInput {
  /** 0..10 — diversity of feedback channels observed. */
  channelDiversity: number;
  /** 0..10 — average authenticity across reactions. */
  averageAuthenticity: number;
  /** True when a counter-narrative is forming. */
  counterNarrativeForming: boolean;
  /** True when reactions exist at all. */
  anyReactionsAtAll: boolean;
}

export function readFeedbackEcologyMonitor(input: FeedbackEcologyInput): FeedbackEcologyReading {
  const { channelDiversity, averageAuthenticity, counterNarrativeForming, anyReactionsAtAll } = input;
  const notes: string[] = [];

  const ecology_state: FeedbackEcology =
    !anyReactionsAtAll ? 'collapsed' :
    averageAuthenticity < 4 || counterNarrativeForming ? 'polluted' :
    channelDiversity < 3 ? 'thin' : 'healthy';

  const ecology_supports_learning = ecology_state === 'healthy';

  const ecology_note = ecology_state === 'healthy'
    ? 'the feedback ecology is healthy — diverse channels, authentic reactions, no counter-narrative pollution'
    : ecology_state === 'thin' ? 'the ecology is thin — too few channels to triangulate'
    : ecology_state === 'polluted' ? 'the ecology is polluted — performed or counter-narrative signals contaminate it'
    : 'the ecology has collapsed — no feedback at all to read';

  notes.push(`feedback ecology monitor: ${ecology_state} — ${ecology_note}`);
  return { ecology_state, ecology_supports_learning, ecology_note, notes };
}
