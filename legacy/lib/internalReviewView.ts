/**
 * INTERNAL REVIEW VIEW (Wave 26 — Phase 7)
 *
 * Surfaces os.currentReview to the dashboard. Hidden when null.
 * Every field is read directly from persisted state — no derivation,
 * no rerunning of the scoring, no client-side computation.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type { ReviewRecommendation } from './operatingSystemCore';

export interface InternalReviewViewModel {
  present: boolean;
  reviewId?: string;
  createdTick?: number;
  derivedFromDraftId?: string;
  derivedFromDraftTick?: number;
  qualityScore?: number;
  coherenceScore?: number;
  restraintScore?: number;
  contradictionScore?: number;
  depthScore?: number;
  noveltyScore?: number;
  evaluation?: string;
  weaknesses?: string[];
  strengths?: string[];
  recommendation?: ReviewRecommendation;
  statement: string;
}

export function buildInternalReviewView(snap: RuntimeSnapshot): InternalReviewViewModel {
  const r = snap.os?.currentReview ?? null;
  if (!r) {
    return { present: false, statement: 'no review yet' };
  }
  return {
    present: true,
    reviewId: r.reviewId,
    createdTick: r.createdTick,
    derivedFromDraftId: r.derivedFromDraftId,
    derivedFromDraftTick: r.derivedFromDraftTick,
    qualityScore: r.qualityScore,
    coherenceScore: r.coherenceScore,
    restraintScore: r.restraintScore,
    contradictionScore: r.contradictionScore,
    depthScore: r.depthScore,
    noveltyScore: r.noveltyScore,
    evaluation: r.evaluation,
    weaknesses: r.weaknesses,
    strengths: r.strengths,
    recommendation: r.recommendation,
    statement:
      `review at tick ${r.createdTick} → ${r.recommendation} ` +
      `(quality ${r.qualityScore}/10, coherence ${r.coherenceScore}/10)`,
  };
}
