/**
 * CONTRADICTION FEEDBACK SCANNER (Phase 226 — Wave 13: Reality Feedback Infrastructure)
 *
 * Reality often answers an action with a contradiction — "you said X
 * but acted Y." This scanner reads incoming reactions for those
 * contradictions, so the organism learns from the gap it created.
 */

export interface FeedbackContradiction {
  claim: string;
  reality: string;
  severity: number;  // 0..10
}

export interface ContradictionScannerReading {
  contradictions_found: FeedbackContradiction[];
  /** True when a serious contradiction was detected in the feedback. */
  any_serious_contradiction: boolean;
  /** 0..10 — total contradiction load found in feedback. */
  contradiction_load: number;
  notes: string[];
}

export interface ContradictionScannerInput {
  /** True when the action promised quiet truth but reception read as stimulus. */
  promisedTruthReceivedAsStimulus: boolean;
  /** True when the action claimed to add but reception read as noise. */
  claimedAdditionReceivedAsNoise: boolean;
  /** True when the action claimed restraint but cadence shows flooding. */
  claimedRestraintShowsFlooding: boolean;
}

export function readContradictionFeedbackScanner(input: ContradictionScannerInput): ContradictionScannerReading {
  const { promisedTruthReceivedAsStimulus, claimedAdditionReceivedAsNoise, claimedRestraintShowsFlooding } = input;
  const notes: string[] = [];
  const contradictions_found: FeedbackContradiction[] = [];

  if (promisedTruthReceivedAsStimulus) {
    contradictions_found.push({ claim: 'this is a true quiet beat', reality: 'reception reads stimulus, not truth', severity: 7 });
  }
  if (claimedAdditionReceivedAsNoise) {
    contradictions_found.push({ claim: 'this adds meaning to the feed', reality: 'reception reads it as one more noisy banner', severity: 6 });
  }
  if (claimedRestraintShowsFlooding) {
    contradictions_found.push({ claim: 'the campaign practices restraint', reality: 'cadence pattern shows flooding', severity: 8 });
  }

  const contradiction_load = contradictions_found.reduce((s, c) => s + c.severity, 0);
  const any_serious_contradiction = contradictions_found.some((c) => c.severity >= 6);

  notes.push(`contradiction feedback scanner: ${contradictions_found.length} contradiction(s), load ${contradiction_load}` +
    (any_serious_contradiction ? ' — a serious gap between claim and reality' : ''));
  return { contradictions_found, any_serious_contradiction, contradiction_load, notes };
}
