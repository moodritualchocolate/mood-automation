/**
 * COGNITIVE COHERENCE VIEW (Wave 26 — Phase 7)
 *
 * Rolling coherence score over recent reviews from the lineage.
 * Pure derivation — no stored field. Hidden until at least one
 * review exists in the lineage.
 *
 * trend = comparison of first-half-mean vs second-half-mean of the
 * recent window. 'flat' when only one sample exists.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export type CoherenceTrend = 'rising' | 'falling' | 'steady' | 'flat';

export interface CognitiveCoherenceViewModel {
  present: boolean;
  recentScores: number[];
  rollingAverage: number;
  trend: CoherenceTrend;
  statement: string;
}

const WINDOW = 8;

export function buildCognitiveCoherenceView(snap: RuntimeSnapshot): CognitiveCoherenceViewModel {
  const lineage = snap.cognitiveLineage;
  if (!lineage) {
    return {
      present: false, recentScores: [], rollingAverage: 0, trend: 'flat',
      statement: 'no cognitive coherence — lineage empty',
    };
  }

  const reviewScores = lineage.entries
    .filter((e) => e.kind === 'review')
    .map((e) => (e.payload as import('./operatingSystemCore').CurrentReview).coherenceScore)
    .slice(-WINDOW);

  if (reviewScores.length === 0) {
    return {
      present: false, recentScores: [], rollingAverage: 0, trend: 'flat',
      statement: 'no cognitive coherence yet — no reviews recorded',
    };
  }

  const rollingAverage = Math.round(
    (reviewScores.reduce((a, b) => a + b, 0) / reviewScores.length) * 10,
  ) / 10;

  let trend: CoherenceTrend;
  if (reviewScores.length === 1) {
    trend = 'flat';
  } else {
    const mid = Math.floor(reviewScores.length / 2);
    const firstHalf = reviewScores.slice(0, mid);
    const secondHalf = reviewScores.slice(mid);
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondMean - firstMean;
    if (diff > 0.5) trend = 'rising';
    else if (diff < -0.5) trend = 'falling';
    else trend = 'steady';
  }

  return {
    present: true,
    recentScores: reviewScores,
    rollingAverage,
    trend,
    statement:
      `coherence rolling ${rollingAverage}/10 across ${reviewScores.length} ` +
      `recent review${reviewScores.length === 1 ? '' : 's'} — trend ${trend}`,
  };
}
