/**
 * COLLECTIVE RECOGNITION (Phase 12)
 *
 * The new question the spec demands:
 *
 *   "Would multiple strangers instantly feel: this is about us?"
 *
 * Not: "this is about him." Not: "this is about her."
 *
 * The score is high when:
 *   - the banner touches a SHARED cultural pattern (not one private
 *     situation)
 *   - the truth uses inclusive observation ("they / people who / a
 *     generation that") more than singular protagonist language
 *   - the cultural symptoms named by the pattern are visible or
 *     implied in the scene
 *
 * The score is low when:
 *   - the truth is about ONE specific imagined person
 *   - the scene reads as a portrait of an individual, not a moment
 *     in a culture
 *   - no shared cultural pattern matches the candidate
 *
 * This is the spec's "stop generating ads, start generating
 * recognition" rule made measurable.
 */

import type { HumanTruth } from '@/core/types';
import type { CulturalPattern } from './sharedCulturalMemory';
import type { EmotionalCore } from './humanTruthEngine';

export interface CollectiveRecognitionReading {
  pattern: CulturalPattern | null;
  pattern_strength: number;            // raw match strength
  recognition_score: number;           // 0..10
  is_collective: boolean;              // would multiple strangers recognise themselves
  is_individual_only: boolean;         // banner reads as a portrait of one person
  inclusive_phrasing_score: number;    // 0..10 — how much the truth uses collective phrasing
  shared_symptoms_implied: string[];
  notes: string[];
}

export interface CollectiveRecognitionInput {
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  pattern: CulturalPattern | null;
  pattern_strength: number;
}

const INCLUSIVE_TOKENS = /\b(they|people who|a generation|everyone|nobody|no one|all of us|us|we|anyone|most)\b/i;
const INDIVIDUAL_TOKENS = /\b(he|she|him|her|his|hers|himself|herself|i feel|my own)\b/i;

export function readCollectiveRecognition(input: CollectiveRecognitionInput): CollectiveRecognitionReading {
  const { truth, pattern, pattern_strength } = input;
  const text = truth.truth.toLowerCase();
  const tension = (truth.tension ?? '').toLowerCase();

  // ─── inclusive phrasing ───────────────────────────────────────
  let inclusive_hits = 0;
  if (INCLUSIVE_TOKENS.test(text)) inclusive_hits += 2;
  if (INCLUSIVE_TOKENS.test(tension)) inclusive_hits += 1;
  let individual_hits = 0;
  if (INDIVIDUAL_TOKENS.test(text)) individual_hits += 2;
  if (INDIVIDUAL_TOKENS.test(tension)) individual_hits += 1;
  const inclusive_phrasing_score = Math.max(0, Math.min(10, inclusive_hits * 3 - individual_hits * 1.5 + 4));

  // ─── shared symptoms implied ─────────────────────────────────
  const shared_symptoms_implied: string[] = [];
  if (pattern) {
    for (const symptom of pattern.cultural_symptoms) {
      // Crude: any 2-token overlap counts as implied.
      const symptomTokens = symptom.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
      const matches = symptomTokens.filter((t) => text.includes(t) || tension.includes(t)).length;
      if (matches >= 1) shared_symptoms_implied.push(symptom);
    }
  }

  // ─── recognition score ────────────────────────────────────────
  let recognition_score = 3;
  if (pattern) recognition_score += Math.min(4, pattern_strength * 0.6);
  recognition_score += inclusive_phrasing_score * 0.3;
  recognition_score += shared_symptoms_implied.length * 0.6;
  recognition_score -= individual_hits * 0.7;
  recognition_score = Math.max(0, Math.min(10, recognition_score));

  // ─── verdicts ─────────────────────────────────────────────────
  const is_individual_only = !pattern && individual_hits >= 2;
  const is_collective = pattern !== null && recognition_score >= 6;

  const notes: string[] = [];
  if (pattern) notes.push(`shared pattern: "${pattern.named_tension}"`);
  if (is_collective) notes.push('multiple strangers would think "this is about us"');
  if (is_individual_only) notes.push('reads as one specific person — not collective');
  if (inclusive_phrasing_score < 4 && pattern) notes.push('pattern is collective but the truth is phrased individually — rewrite toward "they / people who"');
  if (notes.length === 0) notes.push('no specific collective recognition');

  return {
    pattern,
    pattern_strength,
    recognition_score,
    is_collective,
    is_individual_only,
    inclusive_phrasing_score,
    shared_symptoms_implied,
    notes,
  };
}
