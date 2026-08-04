/**
 * TRUTH FATIGUE (Phase 31 — Emotional Continuity Runtime / Wave 2)
 *
 * Detects when a human truth has been said often enough that it has
 * stopped being a truth and become a SLOGAN — repeated language,
 * repeated phrasing, recognition worn smooth.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { HumanTruth } from '@/core/types';

export interface TruthFatigueReading {
  /** 0..10 — how fatigued the campaign's truths are. */
  truth_fatigue: number;
  /** True when the candidate's truth has worn into a slogan. */
  truth_became_slogan: boolean;
  /** Phrases the campaign has repeated. */
  worn_phrases: string[];
  notes: string[];
}

export interface TruthFatigueInput {
  trail: EmotionalTraceEntry[];
  candidateTruth: HumanTruth;
}

const STOP = new Set(['that', 'this', 'with', 'from', 'they', 'their', 'have', 'been', 'what', 'when', 'about', 'into', 'still', 'just']);

export function readTruthFatigue(input: TruthFatigueInput): TruthFatigueReading {
  const { trail, candidateTruth } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 12);
  if (window.length < 4) {
    return {
      truth_fatigue: 0, truth_became_slogan: false, worn_phrases: [],
      notes: ['truth fatigue: history too short to wear a truth smooth'],
    };
  }

  const wordCounts: Record<string, number> = {};
  for (const t of window) {
    for (const w of t.truth.toLowerCase().split(/[^a-z֐-׿]+/).filter((x) => x.length >= 5 && !STOP.has(x))) {
      wordCounts[w] = (wordCounts[w] ?? 0) + 1;
    }
  }
  const worn_phrases = Object.entries(wordCounts)
    .filter(([, c]) => c >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  // Does the candidate truth reuse worn phrases?
  const candidateWords = candidateTruth.truth.toLowerCase().split(/[^a-z֐-׿]+/).filter((x) => x.length >= 5);
  const reusedCount = candidateWords.filter((w) => worn_phrases.includes(w)).length;
  const truth_became_slogan = reusedCount >= 2;

  let truth_fatigue = Math.min(7, worn_phrases.length * 1.6);
  if (truth_became_slogan) truth_fatigue += 3;
  truth_fatigue = Math.min(10, round1(truth_fatigue));

  if (worn_phrases.length) notes.push(`truth fatigue: worn phrases — ${worn_phrases.join(', ')}`);
  if (truth_became_slogan) notes.push('truth fatigue: the candidate truth reuses worn language — the truth is becoming a slogan');

  return { truth_fatigue, truth_became_slogan, worn_phrases, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
