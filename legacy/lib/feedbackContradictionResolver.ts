/**
 * FEEDBACK CONTRADICTION RESOLVER (Phase 252 — Wave 13: Reality Feedback Infrastructure)
 *
 * When the feedback signals disagree — high trust but low resonance,
 * applause but argument — this module resolves the contradiction
 * rather than letting the organism pick whichever signal it prefers.
 */

export interface FeedbackContradictionResolverReading {
  /** True when contradictory feedback signals were reconciled. */
  contradictions_resolved: boolean;
  /** Number of internal contradictions surfaced this cycle. */
  contradictions_surfaced: number;
  /** The resolution the resolver committed to. */
  resolved_reading: string;
  notes: string[];
}

export interface FeedbackContradictionResolverInput {
  /** -10..10 — trust shift signal. */
  trustShift: number;
  /** 0..10 — resonance signal. */
  resonance: number;
  /** True when reactions were classified as argument. */
  argumentReactions: boolean;
  /** True when reactions were classified as applause. */
  applauseReactions: boolean;
}

export function readFeedbackContradictionResolver(input: FeedbackContradictionResolverInput): FeedbackContradictionResolverReading {
  const { trustShift, resonance, argumentReactions, applauseReactions } = input;
  const notes: string[] = [];

  let contradictions_surfaced = 0;
  if (trustShift > 0.5 && resonance < 4) contradictions_surfaced += 1;
  if (trustShift < -0.5 && resonance >= 6) contradictions_surfaced += 1;
  if (argumentReactions && applauseReactions) contradictions_surfaced += 1;

  const contradictions_resolved = contradictions_surfaced > 0;

  const resolved_reading = !contradictions_resolved
    ? 'feedback signals agree — no contradiction to resolve'
    : trustShift > 0.5 && resonance < 4
      ? 'resolved: trust grew without resonance — the audience trusted the brand for showing up, not for the message itself'
      : trustShift < -0.5 && resonance >= 6
        ? 'resolved: the resonance was real but cost trust — a moving but mistimed action'
        : 'resolved: argument and applause coexisted — the action polarised, did not unite';

  notes.push(`feedback contradiction resolver: ${contradictions_surfaced} contradiction(s) — ${resolved_reading}`);
  return { contradictions_resolved, contradictions_surfaced, resolved_reading, notes };
}
