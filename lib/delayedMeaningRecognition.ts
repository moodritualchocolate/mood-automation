/**
 * DELAYED MEANING RECOGNITION (Phase 267 — Wave 14: Live Civilization Coupling)
 *
 * The deepest meanings arrive late and quietly. This module recognises
 * delayed meaning the moment it surfaces — so the organism does not
 * miss the slow truth crystallising in the audience.
 */

export interface DelayedMeaningReading {
  /** True when delayed meaning was recognised this cycle. */
  delayed_meaning_recognised: boolean;
  meaning_summary: string | null;
  /** 0..10 — strength of the recognised meaning. */
  meaning_strength: number;
  notes: string[];
}

export interface DelayedMeaningInput {
  /** True when reaction latency reads as delayed-truth. */
  delayedTruthLatency: boolean;
  /** 0..10 — meaning persistence. */
  meaningPersistence: number;
  /** True when a slow truth was detected. */
  slowTruthDetected: boolean;
}

export function readDelayedMeaningRecognition(input: DelayedMeaningInput): DelayedMeaningReading {
  const { delayedTruthLatency, meaningPersistence, slowTruthDetected } = input;
  const notes: string[] = [];

  const delayed_meaning_recognised = (delayedTruthLatency || slowTruthDetected) && meaningPersistence >= 5;
  const meaning_strength = round1(Math.min(10,
    (delayedTruthLatency ? 3 : 0) + (slowTruthDetected ? 3 : 0) + meaningPersistence * 0.4));

  const meaning_summary = delayed_meaning_recognised
    ? 'a slow meaning has surfaced — the truth that arrived late is the deeper one'
    : null;

  notes.push(`delayed meaning recognition: ${delayed_meaning_recognised ? `RECOGNISED — "${meaning_summary}"` : 'no delayed meaning this cycle'} (${meaning_strength}/10)`);
  return { delayed_meaning_recognised, meaning_summary, meaning_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
