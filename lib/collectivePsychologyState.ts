/**
 * COLLECTIVE PSYCHOLOGY STATE (Phase 42 — World-State Executive Brain / Wave 4)
 *
 * Reads the COLLECTIVE psychological state — the shared exhaustion,
 * emotional volatility, and anxiety pressure the audience is living
 * inside. The campaign does not enter a vacuum; it enters a mood.
 */

import type { IngestedSignal } from './realityIngestion';
import type { EmotionalTraceEntry } from './humanMemory';

export interface CollectivePsychologyReading {
  collective_exhaustion: number;    // 0..10
  emotional_volatility: number;     // 0..10
  anxiety_pressure: number;         // 0..10
  notes: string[];
}

export interface CollectivePsychologyInput {
  ingestedSignals: IngestedSignal[];
  trail: EmotionalTraceEntry[];
}

const EXHAUSTION_RX = /\b(tired|exhausted|burnt? out|drained|can'?t anymore|no energy|depleted|worn)\b|(עייף|מותש|נגמר לי|אין כוח)/i;
const ANXIETY_RX = /\b(anxious|anxiety|dread|panic|on edge|overwhelm|spiral|cant breathe)\b|(חרדה|לחץ|מוצף|פאניקה)/i;
const VOLATILITY_RX = /\b(angry|furious|crying|breaking|snapped|raw|too much|losing it)\b|(כועס|בוכה|נשבר|יותר מדי)/i;

export function readCollectivePsychology(input: CollectivePsychologyInput): CollectivePsychologyReading {
  const { ingestedSignals, trail } = input;
  const notes: string[] = [];

  const corpus = [
    ...ingestedSignals.map((s) => s.text),
    ...trail.slice(0, 20).map((t) => `${t.truth} ${t.tension}`),
  ];
  const total = Math.max(1, corpus.length);

  let exhaustionHits = 0, anxietyHits = 0, volatilityHits = 0;
  for (const text of corpus) {
    if (EXHAUSTION_RX.test(text)) exhaustionHits += 1;
    if (ANXIETY_RX.test(text)) anxietyHits += 1;
    if (VOLATILITY_RX.test(text)) volatilityHits += 1;
  }

  // A modern baseline of ~5, moved by the corpus.
  const collective_exhaustion = round1(clamp10(4 + (exhaustionHits / total) * 14));
  const anxiety_pressure = round1(clamp10(4 + (anxietyHits / total) * 14));
  const emotional_volatility = round1(clamp10(3.5 + (volatilityHits / total) * 16));

  notes.push(`collective psychology: exhaustion ${collective_exhaustion}/10, anxiety ${anxiety_pressure}/10, volatility ${emotional_volatility}/10`);
  return { collective_exhaustion, emotional_volatility, anxiety_pressure, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
