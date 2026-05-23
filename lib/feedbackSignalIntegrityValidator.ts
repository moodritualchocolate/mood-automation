/**
 * FEEDBACK SIGNAL INTEGRITY VALIDATOR (Phase 254 — Wave 13: Reality Feedback Infrastructure)
 *
 * The feedback signal itself must be trustworthy before any conclusion
 * is drawn from it. This validator confirms the signal has not been
 * gamed, corrupted, or biased into uselessness.
 */

export interface FeedbackSignalIntegrityReading {
  /** True when the feedback signal has integrity worth acting on. */
  signal_has_integrity: boolean;
  /** 0..10 — overall signal integrity. */
  integrity_score: number;
  integrity_issues: string[];
  notes: string[];
}

export interface FeedbackSignalIntegrityInput {
  /** 0..10 — signal quality from the filter. */
  signalQuality: number;
  /** True when reactions were largely authentic. */
  reactionsAuthentic: boolean;
  /** True when the feedback bias filter detected significant bias. */
  biasDetected: boolean;
  /** True when contradictions in the feedback are still unresolved. */
  unresolvedContradictions: boolean;
}

export function readFeedbackSignalIntegrityValidator(input: FeedbackSignalIntegrityInput): FeedbackSignalIntegrityReading {
  const { signalQuality, reactionsAuthentic, biasDetected, unresolvedContradictions } = input;
  const notes: string[] = [];

  const integrity_issues: string[] = [];
  if (signalQuality < 5) integrity_issues.push('signal quality too low');
  if (!reactionsAuthentic) integrity_issues.push('reactions are partly performed, not authentic');
  if (biasDetected) integrity_issues.push('the organism\'s own reading bias has crept into the signal');
  if (unresolvedContradictions) integrity_issues.push('contradictory signals remain unresolved');

  const integrity_score = round1(Math.max(0, 10 - integrity_issues.length * 2.5));
  const signal_has_integrity = integrity_issues.length === 0;

  notes.push(`feedback signal integrity validator: ${signal_has_integrity ? 'has integrity' : `${integrity_issues.length} issue(s)`} (${integrity_score}/10)`);
  return { signal_has_integrity, integrity_score, integrity_issues, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
