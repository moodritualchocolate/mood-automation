/**
 * COUNTER-NARRATIVE DETECTION (Phase 245 — Wave 13: Reality Feedback Infrastructure)
 *
 * Sometimes the audience writes its own version of the story — a
 * counter-narrative that runs alongside or against the intended one.
 * This module flags when one is forming.
 */

export interface CounterNarrativeReading {
  /** True when a counter-narrative is forming around the brand. */
  counter_narrative_forming: boolean;
  /** 0..10 — strength of the counter-narrative. */
  counter_strength: number;
  /** The shape the counter-narrative is taking. */
  counter_shape: string;
  notes: string[];
}

export interface CounterNarrativeInput {
  /** True when a serious contradiction was found in reception. */
  contradictionDetected: boolean;
  /** 0..10 — meaning distortion observed in reception. */
  meaningDistortion: number;
  /** True when sentiment has reversed sign. */
  sentimentReversed: boolean;
}

export function readCounterNarrativeDetection(input: CounterNarrativeInput): CounterNarrativeReading {
  const { contradictionDetected, meaningDistortion, sentimentReversed } = input;
  const notes: string[] = [];

  let counter_strength = meaningDistortion * 0.5;
  if (contradictionDetected) counter_strength += 3;
  if (sentimentReversed) counter_strength += 2;
  counter_strength = round1(Math.min(10, counter_strength));

  const counter_narrative_forming = counter_strength >= 5;

  const counter_shape =
    !counter_narrative_forming ? 'none — no counter-narrative forming'
    : sentimentReversed ? 'a sentiment-reversal counter-narrative — the warmth turned cool'
    : contradictionDetected ? 'a contradiction-driven counter-narrative — "the brand said X but did Y"'
    : 'a soft counter-narrative — the audience is gently retelling the story differently';

  notes.push(`counter-narrative detection: ${counter_narrative_forming ? 'FORMING' : 'none'} (${counter_strength}/10) — ${counter_shape}`);
  return { counter_narrative_forming, counter_strength, counter_shape, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
