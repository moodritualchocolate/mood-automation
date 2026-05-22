/**
 * CAMPAIGN HYPOTHESIS ENGINE (Phase 35 — Autonomous Creative Direction / Wave 2)
 *
 * Forms a HYPOTHESIS about what the campaign should do next — a
 * falsifiable creative belief, derived from the campaign nervous
 * system, emotional continuity, and audience feedback.
 */

import type { CampaignNervousSystemReading } from './campaignNervousSystem';
import type { EmotionalContinuityRuntimeReading } from './emotionalContinuityRuntime';
import type { AudienceRealityFeedbackReading } from './audienceRealityFeedback';

export interface CampaignHypothesis {
  /** The campaign's belief about what to do next. */
  hypothesis: string;
  /** What would prove the hypothesis wrong. */
  falsified_if: string;
  /** 0..10 — confidence in the hypothesis. */
  confidence: number;
}

export interface CampaignHypothesisInput {
  nervousSystem: CampaignNervousSystemReading;
  continuity: EmotionalContinuityRuntimeReading;
  feedback: AudienceRealityFeedbackReading;
}

export function formCampaignHypothesis(input: CampaignHypothesisInput): CampaignHypothesis {
  const { nervousSystem, continuity, feedback } = input;

  let hypothesis: string;
  let falsified_if: string;
  let confidence: number;

  if (!nervousSystem.emotionally_alive) {
    hypothesis = `the campaign has saturated "${nervousSystem.motifOveruse[0] ?? 'its current territory'}" — the next move should ${continuity.nextEmotionalMove} into a different emotional register`;
    falsified_if = 'a banner in the saturated territory still produces deep recognition';
    confidence = 7.5;
  } else if (feedback.has_feedback && feedback.audience_recognised_itself) {
    hypothesis = `the audience recognised itself in the current territory — the next move should deepen it, not widen it`;
    falsified_if = 'deepening produces shallower engagement than the previous banner';
    confidence = 7;
  } else if (feedback.has_feedback && feedback.response_corrupts_truth) {
    hypothesis = `the recent response was shallow stimulation — the next move should return to a quieter, truer human moment and ignore the loud signal`;
    falsified_if = 'a quieter banner produces no recognition at all over two runs';
    confidence = 6.5;
  } else if (continuity.activeEmotionalArc === 'stalled') {
    hypothesis = `the emotional arc has stalled — the next move should interrupt it with a contradicting moment`;
    falsified_if = 'the interruption fragments the campaign instead of reviving it';
    confidence = 6;
  } else {
    hypothesis = `the campaign is alive and mid-arc — the next move should ${continuity.nextEmotionalMove} the current emotional thread`;
    falsified_if = 'continuing produces emotional repetition without evolution';
    confidence = 6;
  }

  return { hypothesis, falsified_if, confidence };
}
