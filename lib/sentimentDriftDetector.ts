/**
 * SENTIMENT DRIFT DETECTOR (Phase 235 — Wave 13: Reality Feedback Infrastructure)
 *
 * Sentiment drifts. A campaign that started warm can quietly turn
 * cool. This detector measures the drift across cycles so the
 * organism notices the slow change before it becomes a verdict.
 */

export type SentimentDriftDirection = 'warming' | 'stable' | 'cooling' | 'reversing';

export interface SentimentDriftReading {
  drift_direction: SentimentDriftDirection;
  /** -10..10 — net drift across the observation window. */
  drift_magnitude: number;
  /** True when the drift has crossed from positive to negative or vice-versa. */
  has_reversed: boolean;
  notes: string[];
}

export interface SentimentDriftInput {
  /** -10..10 — sentiment a few cycles ago. */
  sentimentEarlier: number;
  /** -10..10 — sentiment now. */
  sentimentNow: number;
}

export function readSentimentDriftDetector(input: SentimentDriftInput): SentimentDriftReading {
  const { sentimentEarlier, sentimentNow } = input;
  const notes: string[] = [];

  const drift_magnitude = round1(sentimentNow - sentimentEarlier);
  const has_reversed = Math.sign(sentimentEarlier) !== Math.sign(sentimentNow) && Math.abs(sentimentEarlier) >= 0.5 && Math.abs(sentimentNow) >= 0.5;

  const drift_direction: SentimentDriftDirection =
    has_reversed ? 'reversing' :
    drift_magnitude >= 0.6 ? 'warming' :
    drift_magnitude <= -0.6 ? 'cooling' : 'stable';

  notes.push(`sentiment drift detector: ${drift_direction} (${drift_magnitude})` +
    (has_reversed ? ' — sentiment has reversed sign' : ''));
  return { drift_direction, drift_magnitude, has_reversed, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
