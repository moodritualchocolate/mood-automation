/**
 * EMOTIONAL FATIGUE MONITOR (Phase 28 — Campaign Nervous System / Wave 2)
 *
 * Detects EMOTIONAL fatigue — when the campaign's truths have been
 * said often enough that they are weakening, when the same feeling
 * has been expressed past the point of recognition.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface EmotionalFatigueReading {
  /** 0..10 — how emotionally fatigued the campaign is. */
  emotional_fatigue: number;
  /** Emotional territories shown too many times in a row. */
  overused_territories: string[];
  /** True when the dominant truth is losing its force. */
  truth_weakening: boolean;
  /** 0..10 — how strong the campaign's resonance trend is. */
  resonance_trend: number;
  notes: string[];
}

export interface EmotionalFatigueInput {
  trail: EmotionalTraceEntry[];
}

export function readEmotionalFatigue(input: EmotionalFatigueInput): EmotionalFatigueReading {
  const { trail } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 10);
  if (window.length < 4) {
    return {
      emotional_fatigue: 0, overused_territories: [], truth_weakening: false,
      resonance_trend: 6,
      notes: ['emotional fatigue: history too short to fatigue'],
    };
  }

  // Consecutive-family runs are the strongest fatigue signal.
  const familyRuns: Record<string, number> = {};
  for (const t of window) familyRuns[t.family] = (familyRuns[t.family] ?? 0) + 1;
  const overused_territories = Object.entries(familyRuns)
    .filter(([, c]) => c >= 4)
    .map(([f]) => f);

  // Truth weakening: the same tension phrase recurring.
  const tensionCounts: Record<string, number> = {};
  for (const t of window) {
    const key = t.tension.toLowerCase().slice(0, 40);
    tensionCounts[key] = (tensionCounts[key] ?? 0) + 1;
  }
  const truth_weakening = Object.values(tensionCounts).some((c) => c >= 3);

  // Resonance trend — engagement field on the trace entries.
  const engagements = window.map((t) => t.engagement).filter((e) => typeof e === 'number');
  const resonance_trend = engagements.length
    ? round1(Math.min(10, engagements.reduce((a, b) => a + b, 0) / engagements.length))
    : 6;

  let emotional_fatigue = 0;
  emotional_fatigue += overused_territories.length * 3;
  if (truth_weakening) emotional_fatigue += 3;
  if (resonance_trend < 4) emotional_fatigue += 2;
  emotional_fatigue = Math.min(10, round1(emotional_fatigue));

  if (overused_territories.length) notes.push(`emotional fatigue: overused territories — ${overused_territories.join(', ')}`);
  if (truth_weakening) notes.push('emotional fatigue: a tension phrase is recurring — the truth is weakening into a slogan');
  if (emotional_fatigue < 3) notes.push('emotional fatigue: low — the campaign is still emotionally alive');

  return { emotional_fatigue, overused_territories, truth_weakening, resonance_trend, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
