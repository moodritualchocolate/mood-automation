/**
 * CULTURAL SIGNAL EVOLUTION (Phase 25)
 *
 * Tracks how the INGESTED REALITY SIGNALS are changing over time —
 * which emotional vocabulary is rising, which is fading. The engine
 * compares an early window of ingested signals against a late window
 * and reports the cultural movement.
 *
 * This is the system's mechanism for noticing a psychological shift
 * BEFORE it becomes a named trend.
 */

import type { IngestedSignal } from './realityIngestion';

export interface CulturalSignalEvolutionReading {
  /** Phrases gaining ground in the recent window. */
  rising_phrases: string[];
  /** Phrases fading from the recent window. */
  fading_phrases: string[];
  /** 0..10 — how much the cultural signal field is moving. */
  evolution_velocity: number;
  notes: string[];
}

export interface CulturalSignalEvolutionInput {
  ingestedSignals: IngestedSignal[];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z֐-׿]+/).filter((w) => w.length >= 4);
}

export function readCulturalSignalEvolution(input: CulturalSignalEvolutionInput): CulturalSignalEvolutionReading {
  const { ingestedSignals } = input;
  const notes: string[] = [];

  if (ingestedSignals.length < 6) {
    notes.push('cultural signal evolution: not enough ingested signals to detect movement');
    return { rising_phrases: [], fading_phrases: [], evolution_velocity: 0, notes };
  }

  const sorted = [...ingestedSignals].sort((a, b) => a.observed_at - b.observed_at);
  const mid = Math.floor(sorted.length / 2);
  const early = sorted.slice(0, mid);
  const late = sorted.slice(mid);

  const earlyFreq: Record<string, number> = {};
  const lateFreq: Record<string, number> = {};
  for (const s of early) for (const w of tokenize(s.text)) earlyFreq[w] = (earlyFreq[w] ?? 0) + 1;
  for (const s of late) for (const w of tokenize(s.text)) lateFreq[w] = (lateFreq[w] ?? 0) + 1;

  const allWords = new Set([...Object.keys(earlyFreq), ...Object.keys(lateFreq)]);
  const rising: Array<[string, number]> = [];
  const fading: Array<[string, number]> = [];
  for (const w of allWords) {
    const delta = (lateFreq[w] ?? 0) - (earlyFreq[w] ?? 0);
    if (delta >= 2) rising.push([w, delta]);
    if (delta <= -2) fading.push([w, -delta]);
  }
  rising.sort((a, b) => b[1] - a[1]);
  fading.sort((a, b) => b[1] - a[1]);

  const rising_phrases = rising.slice(0, 5).map(([w]) => w);
  const fading_phrases = fading.slice(0, 5).map(([w]) => w);
  const evolution_velocity = Math.min(10, (rising.length + fading.length) * 1.2);

  if (rising_phrases.length) notes.push(`rising cultural vocabulary: ${rising_phrases.join(', ')}`);
  if (fading_phrases.length) notes.push(`fading cultural vocabulary: ${fading_phrases.join(', ')}`);
  notes.push(`evolution velocity: ${evolution_velocity.toFixed(1)}/10`);
  return { rising_phrases, fading_phrases, evolution_velocity, notes };
}
