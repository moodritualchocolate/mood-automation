/**
 * ENGAGEMENT TRUTH SCORING (Phase 132 — Wave 10: Reality Coupling Architecture)
 *
 * Engagement is not proof of resonance. This module scores whether
 * the engagement a banner would earn reflects a TRUE response to a
 * real human truth — or whether it would only be STIMULUS: a reaction
 * to novelty, virality, or an algorithmic hook.
 */

export interface EngagementTruthReading {
  /** 0..10 — high when engagement would reflect genuine resonance. */
  engagement_truth_score: number;
  /** True when the engagement would read as stimulus, not resonance. */
  reads_as_stimulus: boolean;
  scoring_note: string;
  notes: string[];
}

export interface EngagementTruthInput {
  /** 0..10 — how much the run's appeal is engagement-corrupted. */
  engagementCorruption: number;
  /** 0..10 — virality risk. */
  viralityRisk: number;
  /** 0..10 — the strategic truth value of the run. */
  truthValue: number;
  /** True when optimization is corrupting truth. */
  optimizationCorrupts: boolean;
}

export function scoreEngagementTruth(input: EngagementTruthInput): EngagementTruthReading {
  const { engagementCorruption, viralityRisk, truthValue, optimizationCorrupts } = input;
  const notes: string[] = [];

  let engagement_truth_score = 3;
  engagement_truth_score += truthValue * 0.6;
  engagement_truth_score -= engagementCorruption * 0.35;
  engagement_truth_score -= viralityRisk * 0.2;
  if (optimizationCorrupts) engagement_truth_score -= 2;
  engagement_truth_score = round1(Math.max(0, Math.min(10, engagement_truth_score)));

  const reads_as_stimulus = engagement_truth_score < 4 || optimizationCorrupts;

  const scoring_note = reads_as_stimulus
    ? 'the engagement this run would earn reads as stimulus — a reaction to novelty, not resonance with a truth'
    : 'the engagement this run would earn reflects a real response to a human truth';

  notes.push(`engagement truth scoring: ${engagement_truth_score}/10 — ${scoring_note}`);
  return { engagement_truth_score, reads_as_stimulus, scoring_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
