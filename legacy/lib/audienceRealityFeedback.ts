/**
 * AUDIENCE REALITY FEEDBACK LOOP (Phase 32 — Wave 2: Reality Execution)
 *
 * Interprets real-world feedback correctly — not CTR, not likes, but
 * what KIND of human response the campaign created. This module
 * synthesises the Phase 32 sensors into one feedback reading.
 *
 * Meta-critic question: "Did the audience recognise itself, or merely
 * react to stimulation?"
 */

import type { BannerEngagement } from './engagementMemory';
import { readSilentEngagementSignals } from './silentEngagementSignals';
import { readCommentRecognition } from './commentRecognitionParser';
import { readSaveShareMeaning } from './saveShareMeaning';
import { weightRealityFeedback } from './realityFeedbackWeighting';

export interface AudienceRealityFeedbackReading {
  recognitionSignals: number;
  shallowEngagement: number;
  deepEngagement: number;
  saveMeaning: number;
  shareMeaning: number;
  commentTruths: string[];
  audienceLanguage: string[];
  /** True when the audience recognised itself. */
  audience_recognised_itself: boolean;
  /** True when the response would corrupt brand truth if optimised toward. */
  response_corrupts_truth: boolean;
  emotionalMisread: boolean;
  learningRecommendation: string;
  /** True when there is enough feedback to act on at all. */
  has_feedback: boolean;
  notes: string[];
}

export interface AudienceRealityFeedbackInput {
  engagements: BannerEngagement[];
}

export function readAudienceRealityFeedback(input: AudienceRealityFeedbackInput): AudienceRealityFeedbackReading {
  const { engagements } = input;
  const notes: string[] = [];

  const silent = readSilentEngagementSignals({ engagements });
  const comments = readCommentRecognition({ engagements });
  const saveShare = readSaveShareMeaning({ engagements });
  const weighting = weightRealityFeedback({ silent, comments, saveShare });

  const has_feedback = engagements.length > 0 &&
    engagements.some((e) => e.totals.impressions > 0);

  // The response corrupts truth when it is shallow AND loud — chasing
  // it would train the campaign toward stimulation.
  const response_corrupts_truth =
    weighting.response_is_shallow &&
    (comments.comments_are_performative || saveShare.shares_are_trend_driven);

  // Emotional misread — strong shallow reaction but no recognition at
  // all suggests the banner was read as stimulation, not as truth.
  const emotionalMisread = weighting.shallow_engagement >= 6 && comments.recognition_strength < 2;

  notes.push(`audience reality feedback: ${weighting.audience_recognised_itself ? 'the audience RECOGNISED ITSELF' : 'the audience reacted to STIMULATION'}`);
  notes.push(...silent.notes, ...comments.notes, ...saveShare.notes, ...weighting.notes);

  return {
    recognitionSignals: comments.recognition_strength,
    shallowEngagement: weighting.shallow_engagement,
    deepEngagement: weighting.deep_engagement,
    saveMeaning: saveShare.save_meaning,
    shareMeaning: saveShare.share_meaning,
    commentTruths: comments.recognition_phrases,
    audienceLanguage: comments.recognition_phrases,
    audience_recognised_itself: weighting.audience_recognised_itself,
    response_corrupts_truth,
    emotionalMisread,
    learningRecommendation: weighting.learning_recommendation,
    has_feedback,
    notes,
  };
}
