/**
 * REALITY FEEDBACK WEIGHTING (Phase 32 — Audience Reality Feedback / Wave 2)
 *
 * Weights audience feedback CORRECTLY. High engagement does not
 * automatically mean good; low engagement does not automatically mean
 * bad. Ten deep "this is literally me" comments outweigh ten thousand
 * shallow likes. This module produces the corrected weighting.
 */

import type { SilentEngagementReading } from './silentEngagementSignals';
import type { CommentRecognitionReading } from './commentRecognitionParser';
import type { SaveShareMeaningReading } from './saveShareMeaning';

export interface RealityFeedbackWeightingReading {
  /** 0..10 — weighted DEEP engagement (recognition, return). */
  deep_engagement: number;
  /** 0..10 — weighted SHALLOW engagement (performative, trend). */
  shallow_engagement: number;
  /** True when the response is mostly shallow stimulation. */
  response_is_shallow: boolean;
  /** True when the audience genuinely recognised itself. */
  audience_recognised_itself: boolean;
  /** A learning recommendation for the next run. */
  learning_recommendation: string;
  notes: string[];
}

export interface RealityFeedbackWeightingInput {
  silent: SilentEngagementReading;
  comments: CommentRecognitionReading;
  saveShare: SaveShareMeaningReading;
}

export function weightRealityFeedback(input: RealityFeedbackWeightingInput): RealityFeedbackWeightingReading {
  const { silent, comments, saveShare } = input;
  const notes: string[] = [];

  // Deep engagement — silent recognition, recognition comments,
  // meaningful saves. These are weighted heavily.
  const deep_engagement = round1(Math.min(10,
    silent.silent_engagement * 0.35 +
    comments.recognition_strength * 0.4 +
    saveShare.save_meaning * 0.25));

  // Shallow engagement — loud performative reaction, trend-driven
  // shares. These are deliberately discounted.
  const shallow_engagement = round1(Math.min(10,
    silent.loud_engagement * 0.3 +
    comments.performative_strength * 0.45 +
    (saveShare.shares_are_trend_driven ? 4 : saveShare.share_meaning * 0.25)));

  const response_is_shallow = shallow_engagement > deep_engagement + 2;
  const audience_recognised_itself =
    deep_engagement >= 5 || comments.recognition_strength >= 6 || silent.quiet_recognition_pattern;

  let learning_recommendation: string;
  if (audience_recognised_itself) {
    learning_recommendation = 'the audience recognised itself — deepen this emotional territory, do not chase the loud signal';
  } else if (response_is_shallow) {
    learning_recommendation = 'the response is shallow stimulation — do NOT optimise toward it; return to human truth';
  } else {
    learning_recommendation = 'the feedback is thin — hold the course and observe another run';
  }

  notes.push(`reality feedback weighting: deep ${deep_engagement}/10 vs shallow ${shallow_engagement}/10`);
  notes.push(audience_recognised_itself
    ? 'reality feedback: the audience recognised itself'
    : 'reality feedback: the audience reacted to stimulation, it did not recognise itself');

  return {
    deep_engagement, shallow_engagement, response_is_shallow,
    audience_recognised_itself, learning_recommendation, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
