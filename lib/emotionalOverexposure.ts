/**
 * EMOTIONAL OVEREXPOSURE (Phase 37 — Cognitive Energy Management / Wave 4)
 *
 * Detects identity DILUTION through excess visibility — when a brand
 * has been emotionally present so often that its presence stops
 * meaning anything. Scarcity is part of emotional value.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface EmotionalOverexposureReading {
  /** 0..10 — how overexposed the campaign's emotional presence is. */
  overexposure: number;
  /** True when excess visibility is diluting the brand's meaning. */
  identity_dilution: boolean;
  /** 0..10 — truth saturation: how worn the emotional register is. */
  truth_saturation: number;
  notes: string[];
}

export interface EmotionalOverexposureInput {
  trail: EmotionalTraceEntry[];
}

const RECENT_MS = 10 * 24 * 3600 * 1000;

export function readEmotionalOverexposure(input: EmotionalOverexposureInput): EmotionalOverexposureReading {
  const { trail } = input;
  const notes: string[] = [];
  const now = Date.now();

  const recent = trail.filter((t) => now - t.createdAt < RECENT_MS);
  if (recent.length < 4) {
    return {
      overexposure: 0, identity_dilution: false, truth_saturation: 0,
      notes: ['emotional overexposure: campaign presence is still within healthy scarcity'],
    };
  }

  // Overexposure rises with raw frequency over a short window.
  let overexposure = 0;
  if (recent.length >= 12) overexposure += 6;
  else if (recent.length >= 8) overexposure += 4;
  else if (recent.length >= 5) overexposure += 2;

  // Truth saturation — how concentrated the emotional register is.
  const familyCounts: Record<string, number> = {};
  for (const t of recent) familyCounts[t.family] = (familyCounts[t.family] ?? 0) + 1;
  const topFamily = Math.max(...Object.values(familyCounts));
  const truth_saturation = clamp10(round1((topFamily / recent.length) * 10));
  if (truth_saturation >= 7) overexposure += 2;
  overexposure = clamp10(round1(overexposure));

  const identity_dilution = overexposure >= 6;

  notes.push(`emotional overexposure: ${overexposure}/10 — ${recent.length} banners in 10 days, truth saturation ${truth_saturation}/10`);
  if (identity_dilution) notes.push('emotional overexposure: excess visibility is diluting the brand — presence has stopped meaning something');

  return { overexposure, identity_dilution, truth_saturation, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
