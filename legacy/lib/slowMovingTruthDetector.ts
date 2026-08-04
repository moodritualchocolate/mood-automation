/**
 * SLOW-MOVING TRUTH DETECTOR (Phase 253 — Wave 13: Reality Feedback Infrastructure)
 *
 * The truths that matter most often arrive slowly, under the loud
 * fast signals. This module looks beneath the volume for the slow
 * truth — a small consistent shift that the noisy signals would hide.
 */

export interface SlowTruthReading {
  /** True when a slow-moving truth was detected this cycle. */
  slow_truth_detected: boolean;
  slow_truth: string | null;
  /** 0..10 — confidence in the slow truth. */
  confidence: number;
  notes: string[];
}

export interface SlowTruthInput {
  /** Total slow truths detected so far. */
  priorSlowTruths: number;
  /** True when reaction latency reads as "delayed-truth". */
  delayedTruthLatency: boolean;
  /** True when sentiment is drifting slowly. */
  slowSentimentDrift: boolean;
  /** True when trust evolution shape is "building" despite noisy cycles. */
  trustQuietlyBuilding: boolean;
}

export function readSlowMovingTruthDetector(input: SlowTruthInput): SlowTruthReading {
  const { priorSlowTruths, delayedTruthLatency, slowSentimentDrift, trustQuietlyBuilding } = input;
  const notes: string[] = [];

  const signalCount = [delayedTruthLatency, slowSentimentDrift, trustQuietlyBuilding].filter(Boolean).length;
  const slow_truth_detected = signalCount >= 2;
  const confidence = round1(signalCount * 3 + Math.min(2, priorSlowTruths * 0.4));

  const slow_truth = !slow_truth_detected ? null
    : trustQuietlyBuilding && delayedTruthLatency
      ? 'a slow truth: the audience is forming a quiet, deepening trust the fast metrics never showed'
      : slowSentimentDrift
        ? 'a slow truth: the warmth or cool is drifting in one direction beneath the cycle-to-cycle noise'
        : 'a slow truth: reactions that arrive late are richer than reactions that arrive immediately';

  notes.push(`slow-moving truth detector: ${slow_truth_detected ? `DETECTED — ${slow_truth}` : 'no slow truth this cycle'} (confidence ${confidence}/10)`);
  return { slow_truth_detected, slow_truth, confidence, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
