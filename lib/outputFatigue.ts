/**
 * OUTPUT FATIGUE (Phase 37 — Cognitive Energy Management / Wave 4)
 *
 * Detects when the system itself is OVER-POSTING — producing output
 * faster than it produces genuine novelty. The system must learn to
 * ask "should we speak?" not "can we post?".
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface OutputFatigueReading {
  /** 0..10 — how fatigued the campaign's output cadence is. */
  output_fatigue: number;
  /** Count of banners shipped in the recent window. */
  recent_output_count: number;
  /** True when output is outpacing genuine novelty. */
  output_outpacing_novelty: number extends never ? never : boolean;
  notes: string[];
}

export interface OutputFatigueInput {
  trail: EmotionalTraceEntry[];
  /** 0..10 — how emotionally novel the current candidate is. */
  emotionalNovelty: number;
}

const RECENT_MS = 7 * 24 * 3600 * 1000;

export function readOutputFatigue(input: OutputFatigueInput): OutputFatigueReading {
  const { trail, emotionalNovelty } = input;
  const notes: string[] = [];
  const now = Date.now();

  const recent = trail.filter((t) => now - t.createdAt < RECENT_MS);
  const recent_output_count = recent.length;

  // Distinct truths in the recent window — the novelty the output
  // actually carried.
  const distinctTruths = new Set(recent.map((t) => t.truth.toLowerCase().slice(0, 40))).size;
  const noveltyRatio = recent_output_count > 0 ? distinctTruths / recent_output_count : 1;

  let output_fatigue = 0;
  if (recent_output_count >= 10) output_fatigue += 5;
  else if (recent_output_count >= 6) output_fatigue += 3;
  else if (recent_output_count >= 4) output_fatigue += 1.5;
  if (noveltyRatio < 0.5) output_fatigue += 3;
  if (emotionalNovelty < 4) output_fatigue += 2;
  output_fatigue = clamp10(round1(output_fatigue));

  const output_outpacing_novelty = recent_output_count >= 5 && (noveltyRatio < 0.6 || emotionalNovelty < 5);

  notes.push(`output fatigue: ${output_fatigue}/10 — ${recent_output_count} banners in 7 days, novelty ratio ${round1(noveltyRatio)}`);
  if (output_outpacing_novelty) notes.push('output fatigue: output is outpacing genuine novelty — the system is posting, not speaking');

  return { output_fatigue, recent_output_count, output_outpacing_novelty, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
