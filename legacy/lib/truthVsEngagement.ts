/**
 * TRUTH VS ENGAGEMENT (Phase 33 — Anti-Optimization / Wave 2)
 *
 * Resolves the standing tension between human truth and raw
 * engagement. Performance is a SIGNAL, never a master. When truth and
 * engagement point in different directions, truth wins — and this
 * module makes that ruling explicit.
 */

export type TruthEngagementVerdict =
  | 'aligned'                 // truth and engagement agree
  | 'truth-protected'         // they diverged; truth was protected
  | 'engagement-chasing';     // engagement was about to win — flag it

export interface TruthVsEngagementReading {
  verdict: TruthEngagementVerdict;
  /** 0..10 — how far truth and engagement diverge. */
  divergence: number;
  /** True when the decision protected truth over engagement. */
  truth_protected: boolean;
  notes: string[];
}

export interface TruthVsEngagementInput {
  /** 0..10 — how true the banner is. */
  truthStrength: number;
  /** 0..10 — the predicted / observed engagement quality. */
  engagementStrength: number;
  /** 0..10 — the depth of that engagement (recognition vs reaction). */
  engagementDepth: number;
}

export function readTruthVsEngagement(input: TruthVsEngagementInput): TruthVsEngagementReading {
  const { truthStrength, engagementStrength, engagementDepth } = input;
  const notes: string[] = [];

  const divergence = round1(Math.min(10, Math.abs(truthStrength - engagementStrength)));

  let verdict: TruthEngagementVerdict;
  let truth_protected: boolean;

  if (divergence < 3) {
    verdict = 'aligned';
    truth_protected = true;
    notes.push('truth vs engagement: aligned — they point the same way');
  } else if (engagementStrength > truthStrength && engagementDepth < 5) {
    // Engagement is loud AND shallow while truth is weaker — this is
    // exactly the corruption case. Truth must be protected.
    verdict = truthStrength >= 5 ? 'truth-protected' : 'engagement-chasing';
    truth_protected = truthStrength >= 5;
    notes.push(truth_protected
      ? 'truth vs engagement: diverged — engagement was loud and shallow; truth was protected'
      : 'truth vs engagement: WARNING — engagement is winning over a weak truth (engagement-chasing)');
  } else {
    verdict = 'truth-protected';
    truth_protected = true;
    notes.push('truth vs engagement: diverged — truth holds; engagement is a signal, not the master');
  }

  return { verdict, divergence, truth_protected, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
